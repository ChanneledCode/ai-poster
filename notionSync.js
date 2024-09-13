const { Client } = require('@notionhq/client');
const { Prompt, Template, sequelize } = require('./models');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function syncNotionData() {
  try {
    // Drop all tables and recreate them
    await sequelize.drop();
    await sequelize.sync({ force: true });

    // Fetch prompts from Notion
    const promptsResponse = await notion.databases.query({
      database_id: process.env.NOTION_PROMPT_DATABASE_ID,
    });

    // console.log('Notion API Response for Prompts:', JSON.stringify(promptsResponse, null, 2));
    console.log('Number of prompts fetched:', promptsResponse.results.length);

    if (promptsResponse.results.length === 0) {
      console.warn('No prompts found in the Notion database.');
    } else {
      for (const promptPage of promptsResponse.results) {
        // console.log('Processing Prompt:', JSON.stringify(promptPage, null, 2));
        // console.log('Prompt Page:', promptPage);
        const promptContentResponse = await notion.blocks.children.list({ block_id: promptPage.id });
        // console.log('Prompt Content:', JSON.stringify(promptContentResponse, null, 2));

        const title = promptPage.properties.Name?.title?.[0]?.plain_text || 'Untitled';
        const descriptionBlock = promptContentResponse.results.find(block => block.type === 'callout');
        const description = descriptionBlock ? descriptionBlock.callout.rich_text[0].plain_text : '';
        const promptContentBlock = promptContentResponse.results.filter(block => block.type === 'code');
        const promptContent = promptContentBlock.length > 0 ? promptContentBlock[0].code.rich_text[0].plain_text : '';

        // console.log(`Extracted Title: ${title}, Description: ${description}, Prompt Content: ${promptContent}`);

        const [prompt, created] = await Prompt.upsert({
          id: promptPage.id,
          title,
          promptContent,
          description, // Keep this for additional info
        });

        // console.log(`Prompt ${created ? 'created' : 'updated'}:`, JSON.stringify(prompt.toJSON(), null, 2));
      }
    }

    // Fetch all prompts from the database
    const allPrompts = await Prompt.findAll();
    // console.log('All prompts in database after sync:', JSON.stringify(allPrompts, null, 2));

    // Fetch templates from Notion (commented out for now to focus on prompts)
    /*
    const templatesResponse = await notion.databases.query({
      database_id: process.env.NOTION_TEMPLATE_DATABASE_ID,
    });

    console.log('Number of templates fetched:', templatesResponse.results.length);

    for (const templatePage of templatesResponse.results) {
      // ... (template processing code)
    }
    */

    console.log('Notion data sync completed');
    return await Prompt.findAll();
  } catch (error) {
    console.error('Error syncing Notion data:', error);
    throw error;
  }
}

module.exports = { syncNotionData };