# MyBDPhone — Pages / Landing CMS Product Pages

The Product Solutions CMS has been removed. The following navbar pages are now managed entirely through **Admin → CMS & Site Management → Pages / Landing CMS**:

- `/ip-phone`
- `/virtual-number`
- `/business-ip-number`

Each page uses the normal CMS `cms_pages`, `cms_sections` and `cms_items` tables. The built-in bootstrap is idempotent:
- Creates missing pages as `published`
- Promotes an old `draft` built-in page to `published`
- Preserves an intentionally `inactive` page
- Adds only missing sections/cards, never overwriting administrator edits

Typical section structure:
Hero → Feature Cards → Image + Text → How It Works → Use Cases / Benefits → CTA

After restarting the API, open **Pages / Landing CMS** and use **Sections** for each product page. Collection-backed cards can be added, edited, deleted, reordered and activated/deactivated.

No separate Product Solutions CMS route or menu item is required.
