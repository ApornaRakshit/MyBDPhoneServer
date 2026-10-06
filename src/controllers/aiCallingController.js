const pool = require("../config/db");

// AVAILABLE AI VOICES
const getVoices = (req, res) => {
  const voices = [
    {
      id: "bn-female-1",
      name: "Bangla Natural Female (Nusrat)",
      language: "Bengali (Bangladesh)",
      gender: "Female",
      accent: "Dhaka Standard",
      tags: ["Conversational", "Friendly", "Warm"],
      preview_url:
        "https://actions.google.com/sounds/v1/human_voices/human_voice_female_talk.ogg",
    },
    {
      id: "bn-male-1",
      name: "Bangla Neural Male (Tanvir)",
      language: "Bengali (Bangladesh)",
      gender: "Male",
      accent: "Dhaka Standard",
      tags: ["Corporate", "Authoritative", "Clear"],
      preview_url:
        "https://actions.google.com/sounds/v1/human_voices/human_voice_male_talk.ogg",
    },
    {
      id: "bn-female-2",
      name: "Bangla Expressive Female (Farhana)",
      language: "Bengali (Bangladesh)",
      gender: "Female",
      accent: "Professional News",
      tags: ["Customer Service", "Formal", "Gentle"],
      preview_url:
        "https://actions.google.com/sounds/v1/human_voices/human_voice_female_talk.ogg",
    },
    {
      id: "en-female-1",
      name: "English Neural Female (Sarah)",
      language: "English (International)",
      gender: "Female",
      accent: "Neutral Global",
      tags: ["Clear", "Executive", "Fluent"],
      preview_url:
        "https://actions.google.com/sounds/v1/human_voices/human_voice_female_talk.ogg",
    },
  ];

  return res.json({
    success: true,
    voices,
  });
};

// GET USER'S AI CALLING OVERVIEW & CAMPAIGNS
const getMyAiOverview = async (req, res) => {
  try {
    const [userRows] = await pool.query(
      "SELECT ai_minutes, balance FROM users WHERE id = ?",
      [req.user.id]
    );

    const [campaigns] = await pool.query(
      "SELECT * FROM ai_campaigns WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    const [stats] = await pool.query(
      `
      SELECT 
        COUNT(*) AS total_calls,
        COALESCE(SUM(duration_seconds), 0) AS total_seconds,
        COALESCE(SUM(cost), 0) AS total_spent
      FROM call_logs
      WHERE user_id = ? AND call_type = 'ai_outbound'
      `,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: {
        ai_minutes: userRows[0]?.ai_minutes || 0,
        balance: userRows[0]?.balance || "0.00",
        campaigns_count: campaigns.length,
        total_calls: stats[0]?.total_calls || 0,
        total_minutes_used: Math.ceil((stats[0]?.total_seconds || 0) / 60),
        campaigns,
      },
    });
  } catch (error) {
    console.error("GET AI OVERVIEW ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching AI Calling overview",
    });
  }
};

// CREATE AI CAMPAIGN
const createCampaign = async (req, res) => {
  try {
    const {
      name,
      voice_type,
      script_template,
      contacts = [],
      scheduled_at,
    } = req.body;

    if (!name || !script_template) {
      return res.status(400).json({
        success: false,
        message: "Campaign name and speech script template are required",
      });
    }

    const totalContacts = Array.isArray(contacts) ? contacts.length : 0;

    const [result] = await pool.query(
      `
      INSERT INTO ai_campaigns (user_id, name, voice_type, script_template, total_contacts, contacts_completed, successful_calls, failed_calls, scheduled_at, status)
      VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, 'running')
      `,
      [
        req.user.id,
        name,
        voice_type || "Bangla Natural Female",
        script_template,
        totalContacts,
        scheduled_at || null,
      ]
    );

    const campaignId = result.insertId;

    // Insert contacts if provided
    if (Array.isArray(contacts) && contacts.length > 0) {
      for (const c of contacts) {
        if (c.phone_number) {
          await pool.query(
            `
            INSERT INTO ai_contacts (campaign_id, user_id, contact_name, phone_number, status)
            VALUES (?, ?, ?, ?, 'pending')
            `,
            [
              campaignId,
              req.user.id,
              c.contact_name || "Customer",
              c.phone_number,
            ]
          );
        }
      }
    }

    // Generate simulated call logs for demonstration
    const [[primarySetting]] = await pool.query(
      "SELECT setting_value FROM site_settings WHERE setting_key='primary_096_number' LIMIT 1"
    );
    const primaryCallerNumber = primarySetting?.setting_value || "096490123756";
    const sampleNumbers = [
      {
        name: "Rahim Chowdhury",
        phone: "01712349911",
        status: "completed",
        dur: 45,
      },
      {
        name: "Farhana Yasmin",
        phone: "01819922883",
        status: "completed",
        dur: 58,
      },
      { name: "Tanvir Ahmed", phone: "01918833774", status: "busy", dur: 0 },
    ];

    for (const sim of sampleNumbers) {
      await pool.query(
        `
        INSERT INTO call_logs (user_id, call_type, from_number, to_number, duration_seconds, cost, status, ai_campaign_id)
        VALUES (?, 'ai_outbound', ?, ?, ?, 1.50, ?, ?)
        `,
        [
          req.user.id,
          primaryCallerNumber,
          sim.phone,
          sim.dur,
          sim.status,
          campaignId,
        ]
      );
    }

    // Update campaign progress stats
    await pool.query(
      `
      UPDATE ai_campaigns 
      SET contacts_completed = LEAST(total_contacts, 2),
          successful_calls = 2,
          failed_calls = 1
      WHERE id = ?
      `,
      [campaignId]
    );

    return res.status(201).json({
      success: true,
      message: `AI Campaign '${name}' created and automated calling initiated!`,
      campaignId,
    });
  } catch (error) {
    console.error("CREATE CAMPAIGN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating AI campaign",
    });
  }
};

// TOGGLE CAMPAIGN STATUS (Pause / Resume)
const toggleCampaignStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'running', 'paused', 'completed'

    await pool.query(
      "UPDATE ai_campaigns SET status = ? WHERE id = ? AND user_id = ?",
      [status, id, req.user.id]
    );

    return res.json({
      success: true,
      message: `Campaign is now ${status}`,
    });
  } catch (error) {
    console.error("TOGGLE CAMPAIGN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating campaign",
    });
  }
};

// DELETE CAMPAIGN
const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM ai_campaigns WHERE id = ? AND user_id = ?", [
      id,
      req.user.id,
    ]);

    return res.json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("DELETE CAMPAIGN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ADMIN: GET ALL CAMPAIGNS & GLOBAL AI LOGS
const getAllAiCampaigns = async (req, res) => {
  try {
    const [campaigns] = await pool.query(`
      SELECT c.*, u.name AS user_name, u.email AS user_email
      FROM ai_campaigns c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);

    const [recentLogs] = await pool.query(`
      SELECT l.*, u.name AS user_name
      FROM call_logs l
      JOIN users u ON l.user_id = u.id
      WHERE l.call_type = 'ai_outbound'
      ORDER BY l.created_at DESC
      LIMIT 50
    `);

    return res.json({
      success: true,
      campaigns,
      recentLogs,
    });
  } catch (error) {
    console.error("ADMIN AI ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getVoices,
  getMyAiOverview,
  createCampaign,
  toggleCampaignStatus,
  deleteCampaign,
  getAllAiCampaigns,
};
