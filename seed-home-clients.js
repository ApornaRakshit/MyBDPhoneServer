const pool = require('./src/config/db');
const fs = require('fs');

async function seedClients() {
  const files = fs.readdirSync('E:/FreelancerDigitalExpert-Intern/Project/MyBDPhone/mybdphone-client/public/assets/clients');

  function cleanTitle(filename) {
    let name = filename.replace(/\.[^/.]+$/, '');
    name = name.replace(/^imgi_\d+_/, '');
    name = name.replace(/[-_]+/g, ' ');
    return name.trim();
  }

  // 1. Ensure home section is 'clients' instead of 'search'
  const [homePages] = await pool.query("SELECT id FROM cms_pages WHERE slug='home' LIMIT 1");
  if (!homePages.length) {
    console.log('Home page not found');
    process.exit(1);
  }
  const homeId = homePages[0].id;

  // Delete search section from cms_sections if exists
  await pool.query("DELETE FROM cms_sections WHERE page_id=? AND section_key='search'", [homeId]);

  // Insert or update 'clients' section for home
  const [existingClientsSec] = await pool.query("SELECT id FROM cms_sections WHERE page_id=? AND section_key='clients' LIMIT 1", [homeId]);
  if (!existingClientsSec.length) {
    await pool.query(
      `INSERT INTO cms_sections (page_id, section_key, section_type, title, subtitle, settings, sort_order, status)
       VALUES (?, 'clients', 'clients', 'Clients We Have Helped with PBX', 'Trusted by companies across Bangladesh', JSON_OBJECT('collection_key', 'home_clients', 'columns', 5), 4, 'active')`,
      [homeId]
    );
  } else {
    await pool.query(
      `UPDATE cms_sections 
       SET title='Clients We Have Helped with PBX', 
           subtitle='Trusted by companies across Bangladesh',
           section_type='clients', 
           sort_order=4, 
           status='active',
           settings=JSON_SET(COALESCE(settings, JSON_OBJECT()), '$.collection_key', 'home_clients', '$.columns', 5)
       WHERE id=?`,
      [existingClientsSec[0].id]
    );
  }

  // Update other sections order if needed
  await pool.query("UPDATE cms_sections SET sort_order=4 WHERE page_id=? AND section_key='clients'", [homeId]);

  // Seed home_clients in cms_items
  const [existingItems] = await pool.query("SELECT COUNT(id) as count FROM cms_items WHERE collection_key='home_clients'");
  if (existingItems[0].count === 0) {
    console.log('Seeding home_clients cms_items...');
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const title = cleanTitle(f);
      const slug = 'client-' + (i + 1) + '-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const img = '/assets/clients/' + f;
      await pool.query(
        `INSERT INTO cms_items (collection_key, title, slug, image_url, sort_order, status, published_at)
         VALUES ('home_clients', ?, ?, ?, ?, 'active', NOW())`,
        [title, slug, img, i + 1]
      );
    }
    console.log('Seeded ' + files.length + ' home_clients items.');
  } else {
    console.log('home_clients collection already has ' + existingItems[0].count + ' items.');
  }

  // Also update site_settings home_config
  const [settings] = await pool.query("SELECT setting_value FROM site_settings WHERE setting_key='home_config'");
  if (settings.length) {
    let conf = typeof settings[0].setting_value === 'string' ? JSON.parse(settings[0].setting_value) : settings[0].setting_value;
    conf.section_titles = conf.section_titles || {};
    conf.section_titles.clients = 'Clients We Have Helped with PBX';
    delete conf.section_titles.search_title;
    delete conf.section_titles.search;
    conf.section_visibility = conf.section_visibility || {};
    conf.section_visibility.clients = true;
    delete conf.section_visibility.search;
    await pool.query("UPDATE site_settings SET setting_value=? WHERE setting_key='home_config'", [JSON.stringify(conf)]);
    console.log('Updated home_config in site_settings.');
  }

  console.log('Done!');
  process.exit(0);
}

seedClients().catch(e => {
  console.error(e);
  process.exit(1);
});
