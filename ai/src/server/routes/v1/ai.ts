const ACCOUNT_ID = process.env["CF_ACCOUNT_ID"];
const AI_TOKEN = process.env["WORKER_AI_TOKEN"];

// CHAT: @cf/meta/llama-2-7b-chat-int8
const MODEL = "@cf/bytedance/stable-diffusion-xl-lightning";

import { defineEventHandler, readBody, getRequestURL, createError } from "h3";

export default defineEventHandler(async (event) => {
  const requestURL = await getRequestURL(event);

  // TODO: improve the security check for invalid requests
  if (
    !requestURL.origin.includes("localhost") &&
    !requestURL.origin.includes("pages.dev")
  ) {
    throw createError({
      statusMessage: "Unauthorized Request!",
      statusCode: 403,
    });
  }

  // TODO: use event context to restrict the source caller
  const { prompt } = await readBody(event);

  const myHeaders = new Headers();
  myHeaders.append("Authorization", `Bearer ${AI_TOKEN}`);
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    prompt,
  });

  const requestOptions: RequestInit = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow",
  };

  try {
    const result = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`,
      requestOptions
    ).then((response) => response.arrayBuffer());

    // transform image to base64, so we can return it as json
    return {
      result: Buffer.from(result).toString("base64"),
    };
  } catch (error) {
    return error;
  }
});
