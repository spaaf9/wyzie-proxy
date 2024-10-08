import { getBodyBuffer } from "@/utils/body";
import { getProxyHeaders, getAfterResponseHeaders, getBlacklistedHeaders } from "@/utils/headers";

// TODO: Fix the issue when  the user goes to https://proxy.wyzie.ru/reddit.com and clicks on a link and then gets taken to https://proxy.wyzie.ru/r/midlyinfuriating which doesnt exist, we need to fix routing.

export default defineEventHandler(async (event) => {
  // handle cors, if applicable
  if (isPreflightRequest(event)) return handleCors(event, {});

  // Extract destination from router param or query parameter
  let destination: string =
    getRouterParam(event, "url") || getQuery<{ destination?: string }>(event).destination || "";
  const body = await getBodyBuffer(event);

  if (!/^(https?:\/\/)/.test(destination)) {
    destination = `https://${destination}`;
  }

  // proxy
  try {
    await specificProxyRequest(event, destination, {
      blacklistedHeaders: getBlacklistedHeaders(),
      fetchOptions: {
        redirect: "follow",
        headers: getProxyHeaders(event.headers),
        body,
      },
      onResponse(outputEvent, response) {
        const headers = getAfterResponseHeaders(response.headers, response.url);
        setResponseHeaders(outputEvent, headers);
      },
    });
  } catch (e) {
    console.log("Error fetching", e);
    throw e;
  }
});
