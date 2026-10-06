-- MyBDPhone PDF landing-page CMS seed.
-- Run once after 010_cms_engine.sql. Safe to re-run for missing rows.
INSERT INTO cms_sections (page_id, section_key, section_type, title, subtitle, settings, sort_order, status)
SELECT id, 'clients', 'clients', 'Clients We Have Helped with PBX', 'Trusted by companies across Bangladesh', JSON_OBJECT('collection_key', 'home_clients', 'columns', 5), 4, 'active'
FROM cms_pages WHERE slug='home'
AND NOT EXISTS (SELECT 1 FROM cms_sections s WHERE s.page_id=cms_pages.id AND s.section_key='clients');

INSERT INTO cms_sections (page_id, section_key, section_type, title, subtitle, settings, sort_order, status)
SELECT id, 'advantages', 'collection', 'Why Businesses Across Bangladesh Trust Us', 'THE MYBDPHONE ADVANTAGE', JSON_OBJECT('collection','home_advantages'), 5, 'active'
FROM cms_pages WHERE slug='home'
AND NOT EXISTS (SELECT 1 FROM cms_sections s WHERE s.page_id=cms_pages.id AND s.section_key='advantages');

INSERT INTO cms_sections (page_id, section_key, section_type, title, subtitle, settings, sort_order, status)
SELECT id, 'packages', 'packages', 'Choose the Perfect Package for Your Business', 'TRANSPARENT PRICING', JSON_OBJECT(), 6, 'active'
FROM cms_pages WHERE slug='home'
AND NOT EXISTS (SELECT 1 FROM cms_sections s WHERE s.page_id=cms_pages.id AND s.section_key='packages');

INSERT INTO cms_sections (page_id, section_key, section_type, title, subtitle, settings, sort_order, status)
SELECT id, 'addons', 'collection', 'Digital Phone Services Marketplace', 'ADD-ONS & UPGRADES', JSON_OBJECT('collection','home_addons'), 7, 'active'
FROM cms_pages WHERE slug='home'
AND NOT EXISTS (SELECT 1 FROM cms_sections s WHERE s.page_id=cms_pages.id AND s.section_key='addons');

UPDATE cms_sections s JOIN cms_pages p ON p.id=s.page_id
SET s.sort_order = CASE s.section_key
  WHEN 'hero' THEN 1 WHEN 'service_cards' THEN 2 WHEN 'offerings' THEN 3 WHEN 'clients' THEN 4
  WHEN 'advantages' THEN 5 WHEN 'packages' THEN 6 WHEN 'addons' THEN 7 WHEN 'cta' THEN 8
  ELSE s.sort_order END
WHERE p.slug='home';

UPDATE cms_sections s JOIN cms_pages p ON p.id=s.page_id
SET s.status = CASE WHEN s.section_key IN ('hero','service_cards','offerings','clients','advantages','packages','addons','cta') THEN 'active' ELSE 'inactive' END
WHERE p.slug='home';

INSERT INTO cms_items (collection_key,title,slug,description,icon,meta,sort_order,status,published_at)
SELECT * FROM (
  SELECT 'home_advantages','Unified Platform','unified-platform','Manage IP Phone extensions and automated AI Calling campaigns under one unified dashboard.','Layers',NULL,1,'active',NOW()
  UNION ALL SELECT 'home_advantages','Easy Online Recharge','easy-online-recharge','Instant top-ups from ৳100 up to ৳10,000 using bKash, Nagad, Rocket, or Visa/Mastercard.','CreditCard',NULL,2,'active',NOW()
  UNION ALL SELECT 'home_advantages','Multi-Device Access','multi-device-access','Connect seamlessly across Android apps, Windows PCs, laptops, and hardware SIP phones.','Smartphone',NULL,3,'active',NOW()
  UNION ALL SELECT 'home_advantages','Cloud Call Recording','cloud-call-recording','Secure, encrypted call archives with in-browser playback for compliance and training.','Headphones',NULL,4,'active',NOW()
  UNION ALL SELECT 'home_advantages','AI Bangla Voice Bot','ai-bangla-voice-bot','Natural neural text-to-speech engine delivering human-like Bangla outbound call campaigns.','Bot',NULL,5,'active',NOW()
  UNION ALL SELECT 'home_advantages','24/7 Ticketing Helpdesk','24-7-ticketing-helpdesk','Dedicated Bangladeshi telecom engineers ready to assist with SIP setup and routing.','Clock3',NULL,6,'active',NOW()
  UNION ALL SELECT 'home_advantages','Zero Hardcoded Limits','zero-hardcoded-limits','100% scalable cloud architecture with flexible add-ons in our digital service marketplace.','Zap',NULL,7,'active',NOW()
  UNION ALL SELECT 'home_advantages','BTRC Telecom Grade','btrc-telecom-grade','Official licensed IPTSP routing ensuring crystal-clear audio and 99.9% uptime reliability.','ShieldCheck',NULL,8,'active',NOW()
) seed
WHERE NOT EXISTS (SELECT 1 FROM cms_items WHERE collection_key='home_advantages');

INSERT INTO cms_items (collection_key,title,slug,description,icon,meta,sort_order,status,published_at)
SELECT * FROM (
  SELECT 'home_addons','Caller Tune','caller-tune','Play custom corporate brand greeting audio to incoming callers.','Radio','৳99/mo',1,'active',NOW()
  UNION ALL SELECT 'home_addons','Cloud Recording','cloud-recording','Encrypted 90-day archive with web playback & MP3 download.','FileAudio','৳199/mo',2,'active',NOW()
  UNION ALL SELECT 'home_addons','5 Extra Devices','5-extra-devices','Connect 5 additional Android or PC SIP softphones to your line.','Smartphone','৳300/mo',3,'active',NOW()
  UNION ALL SELECT 'home_addons','VIP 096 Number','vip-096-number','Memorable repeating digit premium business hotline number.','Sparkles','৳999 one-time',4,'active',NOW()
) seed
WHERE NOT EXISTS (SELECT 1 FROM cms_items WHERE collection_key='home_addons');

-- Footer configuration matching the supplied PDF layout.
UPDATE site_settings
SET setting_value = JSON_OBJECT(
  'description', 'Bangladesh’s premier unified telecommunications & voice AI platform. Equipping startups, enterprises, and contact centers with official 096 IP numbers, cloud PBX, and programmable AI voice automation.',
  'logo_url', '/uploads/cms/footer-logo.png',
  'payment_image_url', '/uploads/cms/payment.png',
  'footer_note', 'Designed with modern telecom precision for Bangladesh.',
  'columns', JSON_ARRAY(
    JSON_OBJECT('title','IP TELEPHONY','links',JSON_ARRAY(
      JSON_OBJECT('label','096 Number Registration','url','/ip-phone','active',true),
      JSON_OBJECT('label','StartUp Monthly (৳500)','url','/packages','active',true),
      JSON_OBJECT('label','Pro Monthly (৳1,000)','url','/packages','active',true),
      JSON_OBJECT('label','Caller Tune Add-on','url','/shop','active',true),
      JSON_OBJECT('label','Cloud Call Recording','url','/shop','active',true),
      JSON_OBJECT('label','Multi-Device SIP Support','url','/ip-phone','active',true)
    )),
    JSON_OBJECT('title','AI VOICE STUDIO','links',JSON_ARRAY(
      JSON_OBJECT('label','Automated Outbound Calls','url','/ai-calling','active',true),
      JSON_OBJECT('label','Bangla Natural Neural TTS','url','/ai-calling','active',true),
      JSON_OBJECT('label','AI Calling Packages','url','/packages','active',true),
      JSON_OBJECT('label','Voice Campaign Analytics','url','/ai-calling','active',true),
      JSON_OBJECT('label','VIP Golden 096 Numbers','url','/shop','active',true),
      JSON_OBJECT('label','SIP & Webhook APIs','url','/features','active',true)
    )),
    JSON_OBJECT('title','DHAKA SUPPORT HQ','links',JSON_ARRAY())
  ),
  'social', JSON_ARRAY(),
  'newsletter_enabled', false,
  'copyright', '© 2026 MyBDPhone Limited. All rights reserved.'
)
WHERE setting_key='footer_config';

UPDATE site_settings
SET setting_value = JSON_SET(
  setting_value,
  '$.section_titles.offerings', 'Two Powerful Telecom Services. One Seamless Platform.',
  '$.section_titles.clients', 'Clients We Have Helped with PBX',
  '$.section_titles.advantages', 'Why Businesses Across Bangladesh Trust Us',
  '$.section_titles.packages', 'Choose the Perfect Package for Your Business',
  '$.section_titles.addons', 'Digital Phone Services Marketplace',
  '$.section_titles.cta', 'Ready to Upgrade Your Business Telephony?',
  '$.offerings_subtitle', 'Choose between dedicated corporate IP telephony and automated AI voice campaigns — or leverage both under a single dashboard.',
  '$.clients_subtitle', 'Teams and businesses across Bangladesh manage their calls with MyBDPhone.',
  '$.advantages_subtitle', 'Engineered for low latency, maximum telecom compliance, and intelligent voice scalability.',
  '$.packages_subtitle', 'All prices and features are dynamically managed. No hidden fees.',
  '$.addons_subtitle', 'Enhance your 096 line with caller tunes, extra device licenses, VIP numbers, and recording storage.',
  '$.cta_subtitle', 'Get your 096 IP number within 5 minutes or launch your first automated AI voice campaign today.'
)
WHERE setting_key='home_config';
