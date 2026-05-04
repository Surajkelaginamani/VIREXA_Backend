// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const moment = require('moment');
const crypto = require('crypto');
const Schedule = require('../models/Schedule');
const Task = require('../models/Task');
const Chat = require('../models/Chat'); // ✅ IMPORTED NEW CHAT MODEL
const { GoogleGenerativeAI } = require("@google/generative-ai");

const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getConversationTitle = (messages) => {
  const firstUserMessage = messages.find((msg) => msg.role === 'user');
  const titleSource = firstUserMessage?.text || messages[0]?.text || 'New Chat';
  return titleSource.length > 44 ? `${titleSource.slice(0, 44)}...` : titleSource;
};

router.get('/conversations', async (req, res) => {
  try {
    const chats = await Chat.find().sort({ createdAt: 1 }).lean();
    const conversationMap = new Map();

    chats.forEach((chat) => {
      const conversationId = chat.conversationId || 'legacy';

      if (!conversationMap.has(conversationId)) {
        conversationMap.set(conversationId, {
          id: conversationId,
          lastMessage: '',
          updatedAt: chat.createdAt,
          messageCount: 0,
          messages: []
        });
      }

      const conversation = conversationMap.get(conversationId);
      conversation.messages.push(chat);
      conversation.lastMessage = chat.text;
      conversation.updatedAt = chat.createdAt;
      conversation.messageCount += 1;
    });

    const conversations = Array.from(conversationMap.values())
      .map((conversation) => ({
        id: conversation.id,
        title: conversation.id === 'legacy'
          ? 'Previous Chat'
          : getConversationTitle(conversation.messages),
        lastMessage: conversation.lastMessage,
        updatedAt: conversation.updatedAt,
        messageCount: conversation.messageCount
      }))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({ conversations });
  } catch (error) {
    console.error('Fetch Conversations Error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Chat.find({
      conversationId: conversationId === 'legacy' ? { $in: [null, 'legacy'] } : conversationId
    }).sort({ createdAt: 1 }).lean();

    res.json({
      conversationId,
      messages: messages.map((message) => ({
        id: message._id,
        role: message.role,
        text: message.text,
        createdAt: message.createdAt
      }))
    });
  } catch (error) {
    console.error('Fetch Chat Error:', error);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

router.post('/new', (req, res) => {
  res.status(201).json({ conversationId: crypto.randomUUID() });
});

router.post('/', async (req, res) => {
  const { userMessage, userBatch } = req.body; 
  const conversationId = req.body.conversationId || crypto.randomUUID();

  try {
    const currentDay = moment().format('dddd'); 
    const currentTime24 = moment().format('HH:mm'); 
    const todayDate = moment().format('YYYY-MM-DD'); // Getting today's exact date

    // ==========================================
    // 🧹 1. AUTOMATIC CLEANUP (GARBAGE COLLECTION)
    // ==========================================
    
    // Delete tasks older than 4 days past their due date
    const fourDaysAgo = moment().subtract(4, 'days').format('YYYY-MM-DD');
    const deletedTasks = await Task.deleteMany({ dueDate: { $lt: fourDaysAgo } });
    if (deletedTasks.deletedCount > 0) console.log(`Cleaned up ${deletedTasks.deletedCount} old tasks!`);

    // Save the user's new message to DB
    await Chat.create({ conversationId, role: 'user', text: userMessage });

    // Keep ONLY the last 15 messages in the active conversation, delete the rest
    const chatsToKeep = await Chat.find({ conversationId }).sort({ createdAt: -1 }).limit(15);
    if (chatsToKeep.length === 15) {
      const oldestKeptChat = chatsToKeep[14]; 
      await Chat.deleteMany({ conversationId, createdAt: { $lt: oldestKeptChat.createdAt } });
    }

    // ==========================================
    // 🧠 2. FETCH DATA & AI CONTEXT PREPARATION
    // ==========================================

    // Fetch the 15 messages and reverse them to chronological order for the AI
    const recentChats = await Chat.find({ conversationId }).sort({ createdAt: -1 }).limit(15);
    recentChats.reverse(); 
    
    // Format the history into a readable script for the AI
    const chatHistoryScript = recentChats.map(msg => 
      `${msg.role === 'user' ? 'Me' : 'You'}: ${msg.text}`
    ).join('\n');

    const weeklySchedule = await Schedule.find({ batch: { $in: ['ALL', userBatch] } });
    const pendingTasks = await Task.find({ status: 'pending' });

    // THE TIME MATH (Calculate days left for each task)
    const tasksWithUrgency = pendingTasks.map(task => {
      const dueDate = moment(task.dueDate, 'YYYY-MM-DD');
      const today = moment(todayDate, 'YYYY-MM-DD');
      const daysLeft = dueDate.diff(today, 'days'); // Math: If negative, it's overdue!

      return {
        taskId: task._id,
        description: task.description,
        exactDueDate: task.dueDate,
        daysLeft: daysLeft // We are feeding this secret number to the AI
      };
    });

    // ==========================================
    // 🤖 3. THE PROMPT (NOW WITH MEMORY)
    // ==========================================

    const prompt = `
      You are my highly supportive best friend and personal assistant. I am an engineering student.
      
      Current Date & Time: ${todayDate} (${currentDay}, ${currentTime24}).
      
      CONTEXT - Our Recent Conversation:
      ${chatHistoryScript}

      My Timetable: ${JSON.stringify(weeklySchedule)}
      My Pending Tasks (With Urgency Level): ${JSON.stringify(tasksWithUrgency)}

      CRITICAL RULE: Speak in natural Indian "Hinglish" (use words like "yaar", "dost", "bhai", "tension mat le", "abe"). 
      
      YOU MUST RESPOND ONLY IN VALID JSON FORMAT:
      {
        "action": {
          "type": "ADD_TASK" | "COMPLETE_TASK" | "NONE",
          "description": "Short task name",
          "dueDate": "MUST BE STRICTLY IN YYYY-MM-DD FORMAT (Calculate this based on today's date)",
          "taskId": "The MongoDB _id of the task"
        },
        "reply": "Your Hinglish voice response."
      }

      TASK BEHAVIOR INSTRUCTIONS:
      1. ADDING A TASK: If I say "remind me to submit DBMS on Friday", figure out Friday's date (YYYY-MM-DD) and set it as the dueDate. Reply: "Done bhai! DBMS task add kar diya hai."
      2. OVERDUE TASKS (daysLeft < 0): If I just say "Hi" or ask about tasks, and you see a task where daysLeft is negative, SCOLD ME in Hinglish before saying anything else! (Example: "Abe sun, tera React project overdue ho gaya hai, submit nahi kiya kya abhi tak?!")
      3. LAST MINUTE WARNING (daysLeft == 1 or 0): If a task is due tomorrow or today, WARN ME IMMEDIATELY. (Example: "Bhai baki sab theek hai, par tera DBMS assignment kal due hai, jaldi khatam kar usko!")
      4. EXACT DATE: If I ask what is pending, tell me the exact due date and exactly how many days are left. (Example: "Ek DBMS assignment pending hai, 20th ko due hai, matlab exactly 2 din bache hain.")
      5. MEMORY: Look at our "Recent Conversation" above. If I refer to something we just talked about, remember it!

      User says: "${userMessage}"
    `;

    // Force Gemini to return JSON
    const model = genAI.getGenerativeModel({ 
      model: geminiModel,
      generationConfig: { responseMimeType: "application/json" } // This guarantees clean JSON
    });

    const result = await model.generateContent(prompt);
    const aiResponse = JSON.parse(result.response.text());

    // ==========================================
    // 💾 4. DATABASE OPERATIONS & SAVE AI REPLY
    // ==========================================

    if (aiResponse.action.type === 'ADD_TASK') {
      await Task.create({
        description: aiResponse.action.description,
        dueDate: aiResponse.action.dueDate
      });
      console.log(`Task Added: Due exactly on ${aiResponse.action.dueDate}`);
    } 
    else if (aiResponse.action.type === 'COMPLETE_TASK') {
      await Task.findByIdAndUpdate(aiResponse.action.taskId, { status: 'completed' });
      console.log("Task Completed!");
    }

    // ✅ SAVE THE AI'S REPLY TO THE CHAT MEMORY
    await Chat.create({ conversationId, role: 'bot', text: aiResponse.reply });

    res.json({ conversationId, reply: aiResponse.reply });

  } catch (error) {
    console.error("Agent Error:", error);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});

module.exports = router;
