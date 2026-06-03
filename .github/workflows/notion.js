const { Client } = require("@notionhq/client");

// 读取 GitHub Secrets
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DATABASE_ID;

async function run() {
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: "GitHub Action 自动写入成功 🚀",
              },
            },
          ],
        },
      },
    });

    console.log("写入成功：", response.id);
  } catch (err) {
    console.error("失败：", err.body || err);
  }
}

run();
