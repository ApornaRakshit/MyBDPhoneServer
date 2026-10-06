const pool = require('../config/db');

async function seedWhyChooseUs() {
  try {
    console.log('Seeding why-choose-us page and sections...');
    
    // 1. Create Page
    await pool.query(`
      INSERT INTO cms_pages (slug, title, meta_title, meta_description, seo_title, seo_description, template, status, sort_order)
      VALUES (
        'why-choose-us', 
        'Why Choose MyBDPhone', 
        'Why Choose MyBDPhone - Powerful Business Communication Platform', 
        'Discover why modern businesses choose MyBDPhone for all-in-one IP telephony, PBX, and AI communication tools.',
        'Why Choose MyBDPhone - Powerful Business Communication Platform', 
        'Discover why modern businesses choose MyBDPhone for all-in-one IP telephony, PBX, and AI communication tools.',
        'why_choose_us',
        'published',
        135
      )
      ON DUPLICATE KEY UPDATE 
        title=VALUES(title),
        meta_title=VALUES(meta_title),
        meta_description=VALUES(meta_description),
        status='published'
    `);

    const [pages] = await pool.query(`SELECT id FROM cms_pages WHERE slug = 'why-choose-us'`);
    const pageId = pages[0].id;
    console.log('Page ID:', pageId);

    const sectionsToSeed = [
      {
        key: 'hero',
        type: 'HERO',
        title: 'Powerful Communication. Simple Experience.',
        subtitle: 'WHY CHOOSE MYBDPHONE?',
        content_body: 'Everything your business needs to stay connected without complex setups or hardware bloat.',
        custom_settings: {
          floating_cards: [
            '✓ Easy to Manage',
            '✓ Scalable',
            '✓ Business Ready'
          ],
          primary_btn: { text: 'Get Started', url: '/packages' },
          secondary_btn: { text: 'Talk to Specialist', url: '/contact' }
        },
        display_order: 0
      },
      {
        key: 'main_benefits',
        type: 'MAIN_BENEFITS',
        title: 'Key Platform Benefits',
        subtitle: 'Designed for efficiency, clarity, and growth.',
        content_body: '',
        custom_settings: {
          benefits: [
            {
              num: '01',
              title: 'All-in-One Platform',
              desc: 'IP Phone, PBX, AI Calling, and Auto Dialer in one central system.',
              icon: 'Layers'
            },
            {
              num: '02',
              title: 'Easy to Use',
              desc: 'Simple dashboard management with no steep learning curve.',
              icon: 'Smile'
            },
            {
              num: '03',
              title: 'Flexible & Scalable',
              desc: 'Instantly scale extensions and channels as your business grows.',
              icon: 'TrendingUp'
            },
            {
              num: '04',
              title: 'Multi-Device Sync',
              desc: 'Seamless call handling across Android, iOS, Desktop, and Hardware IP Phones.',
              icon: 'Smartphone'
            },
            {
              num: '05',
              title: 'Reliable Uptime',
              desc: 'High-availability telecom network ensuring uninterrupted calling.',
              icon: 'ShieldCheck'
            },
            {
              num: '06',
              title: 'Local 24/7 Support',
              desc: 'Dedicated support team in Bangladesh ready to assist anytime.',
              icon: 'Headphones'
            }
          ]
        },
        display_order: 1
      },
      {
        key: 'comparison',
        type: 'COMPARISON',
        title: 'Traditional Systems vs MyBDPhone',
        subtitle: 'See how MyBDPhone modernizes your entire business telecommunication setup.',
        content_body: '',
        custom_settings: {
          comparison_table: [
            { traditional: 'Multiple fragmented tools', mybdphone: 'One unified platform' },
            { traditional: 'Complex hardware setup', mybdphone: 'Easy cloud-based setup' },
            { traditional: 'Limited flexibility & rigid plans', mybdphone: 'Flexible custom packages' },
            { traditional: 'Hard to manage across locations', mybdphone: 'Centralized online dashboard' },
            { traditional: 'Basic calling features only', mybdphone: 'Advanced AI & Call Automation' }
          ]
        },
        display_order: 2
      },
      {
        key: 'target_audience',
        type: 'TARGET_AUDIENCE',
        title: 'Built for Every Business',
        subtitle: 'Tailored solutions for teams of all sizes.',
        content_body: '',
        custom_settings: {
          audiences: [
            { title: 'Startup', desc: 'Quick setup, low cost, and professional caller ID.', tag: 'Perfect for small teams' },
            { title: 'Small Business', desc: 'Manage client calls smoothly with smart routing.', tag: 'Perfect for growing teams' },
            { title: 'Corporate Team', desc: 'Multi-department PBX extensions and analytics.', tag: 'Perfect for enterprises' },
            { title: 'Call Center', desc: 'High-volume auto dialer, recording, and agent monitoring.', tag: 'Perfect for support & sales' }
          ]
        },
        display_order: 3
      },
      {
        key: 'trust_numbers',
        type: 'TRUST_NUMBERS',
        title: 'Trusted by Growing Companies',
        subtitle: 'Proven stats backing our service reliability.',
        content_body: '',
        custom_settings: {
          stats: [
            { value: '10K+', label: 'Active Users' },
            { value: '24/7', label: 'Dedicated Support' },
            { value: '99.9%', label: 'Service Availability' },
            { value: '1', label: 'Unified Platform' }
          ]
        },
        display_order: 4
      },
      {
        key: 'final_cta',
        type: 'FINAL_CTA',
        title: 'Choose a smarter way to communicate.',
        subtitle: 'Upgrade your business calling infrastructure today.',
        content_body: '',
        custom_settings: {
          primary_btn: { text: 'Get Started', url: '/packages' },
          secondary_btn: { text: 'Talk to Specialist', url: '/contact' }
        },
        display_order: 5
      }
    ];

    for (const sec of sectionsToSeed) {
      const [existing] = await pool.query(
        'SELECT id FROM cms_sections WHERE page_id=? AND (section_key=? OR section_type=?)',
        [pageId, sec.key, sec.type]
      );
      const jsonStr = JSON.stringify(sec.custom_settings);
      if (!existing.length) {
        await pool.query(`
          INSERT INTO cms_sections 
          (page_id, section_key, section_type, title, subtitle, content_body, content_html, custom_settings, settings, display_order, sort_order, is_visible, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active')
        `, [pageId, sec.key, sec.type, sec.title, sec.subtitle, sec.content_body, sec.content_body, jsonStr, jsonStr, sec.display_order, sec.display_order]);
      } else {
        await pool.query(`
          UPDATE cms_sections SET
            section_key=?,
            section_type=?,
            title=COALESCE(NULLIF(title, ''), ?),
            subtitle=COALESCE(NULLIF(subtitle, ''), ?),
            content_body=COALESCE(NULLIF(content_body, ''), ?),
            custom_settings=COALESCE(custom_settings, ?),
            settings=COALESCE(settings, ?),
            display_order=?,
            sort_order=?,
            is_visible=1,
            status='active'
          WHERE id=?
        `, [sec.key, sec.type, sec.title, sec.subtitle, sec.content_body, jsonStr, jsonStr, sec.display_order, sec.display_order, existing[0].id]);
      }
    }

    await pool.query("UPDATE navigation_items SET path='/why-choose-us' WHERE title='Why Choose Us'");
    console.log('Successfully updated navigation item path for Why Choose Us!');
    console.log('Successfully seeded Why Choose Us page and sections!');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seedWhyChooseUs();
