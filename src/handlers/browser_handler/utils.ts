import { type SSOResponseBody } from "@types";
import { Browser, type Page } from "puppeteer";
import env from "../../utils/config";

/*

  CODE CREDIT ATTRIBUTION

  This code was obtained from the cfx-portal-upload repo from Tynopia.

  url:      https://github.com/Tynopia/cfx-portal-upload
  license:  MIT License - https://github.com/Tynopia/cfx-portal-upload/blob/main/LICENSE

  */

export enum Urls {
  API = 'https://portal-api.cfx.re/v1/',
  SSO = 'auth/discourse?return=',
}

export function getUrl(type: keyof typeof Urls, id?: string): string {
  const url = Urls.API + Urls[type]
  return id ? url.replace('{id}', id) : url
}

export async function getCookies(browser: Browser): Promise<string> {
  return await browser
    .cookies()
    .then(cookies =>
      cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ')
    )
}

/**
 * Navigates to the SSO URL and waits for the page to load.
 * If the navigation fails, it will retry up to `maxRetries` times.
 * @param page
 * @param maxRetries
 * @returns {Promise<string>} The redirect URL.
 * @throws If the navigation fails after `maxRetries` attempts.
 */
export async function getRedirectUrl(page: Page, maxRetries: number): Promise<string> {
  let loaded = false;
  let attempt = 0;
  let redirectUrl = null;

  while (!loaded && attempt < maxRetries) {
    try {
      console.log('Navigating to SSO URL ...');

      await page.goto(getUrl('SSO'), {
        waitUntil: 'networkidle0'
      });

      console.log('Navigated to SSO URL. Parsing response body ...');

      const responseBody = await page.evaluate(
        () => JSON.parse(document.body.innerText) as SSOResponseBody
      );

      console.log('[DEBUG]', 'Parsed response body.');

      redirectUrl = responseBody.url;

      console.log('Redirected to Forum Origin ...');

      const forumUrl = new URL(redirectUrl).origin;
      await page.goto(forumUrl);

      loaded = true
    } catch {
      console.log(`Failed to navigate to SSO URL. Retrying in 1 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempt++;
    }
  }

  if (!loaded || redirectUrl == null) {
    throw new Error(
      `Failed to navigate to SSO URL after ${maxRetries} attempts.`
    );
  }

  return redirectUrl
}

/**
 * Sets the cookie for the cfx.re login.
 * @param browser
 * @param page
 * @returns {Promise<void>} Resolves when the cookie has been set.
 */
export async function setForumCookie(browser: Browser, page: Page): Promise<void> {
  console.log('Setting cookies ...')

  if (!env.CFX_COOKIE) throw new Error('CFX_COOKIE was not set !');

  await browser.setCookie({
    name: '_t',
    value: env.CFX_COOKIE,
    domain: 'forum.cfx.re',
    path: '/',
    expires: -1,
    httpOnly: true,
    secure: true,
  });

  await page.evaluate(() => document.write('Cookie' + document.cookie));

  console.log('Cookies set. Following redirect...');
}
