import { GoogleGenAI } from "@google/genai";
async function run() {
  const ai = new GoogleGenAI({ apiKey: "AIzaSyDP8jBy-41etctptbIwVA33_w9xWWtOjxs" });
  try {
    const list = await ai.models.list();
    for await (const model of list) {
        if(model.name.includes("gemini")) {
            console.log(model.name);
        }
    }
  } catch(e) {
    console.error(e);
  }
}
run();
