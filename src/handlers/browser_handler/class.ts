import { Browser as Browsers, getInstalledBrowsers, install } from '@puppeteer/browsers'
import type { Browser, Page } from "puppeteer";
import { join } from 'path'
import { homedir } from 'os'
import puppeteer from 'puppeteer';

import { CfxGrantedAsset } from '@types';

import Logger from '../../utils/logger';
import env from '../../utils/config';
import { getCookies, getRedirectUrl, setForumCookie } from './utils';

const logger = new Logger('BROWSER-HANDLER');

/*

  CODE CREDIT ATTRIBUTION

  This code was inspired from the cfx-portal-upload repo from Tynopia.

  url:      https://github.com/Tynopia/cfx-portal-upload
  license:  MIT License - https://github.com/Tynopia/cfx-portal-upload/blob/main/LICENSE

  */

export class CfxPortalSearch {
  private static async preparePuppeteer(): Promise<void> {
    if (process.env.RUNNER_TEMP === undefined) {
      return;
    }

    const cacheDirectory = join(homedir(), '.cache', 'puppeteer');
    const installed = await getInstalledBrowsers({
      cacheDir: cacheDirectory
    });

    if (!installed.some(browser => browser.browser === Browsers.CHROME)) {
      await install({
        cacheDir: cacheDirectory,
        browser: Browsers.CHROME,
        buildId: '131.0.6778.108'
      });
    }
  }

  static async init(): Promise<CfxPortalSearch> {
    if (!env.CFX_COOKIE) {
      logger.error('Unable to use module, CFX_COOKIE was not specified in environment variables.');
      throw Error('Unable to use module, CFX_COOKIE was not specified in environment variables.');
    }

    await this.preparePuppeteer();

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    return new CfxPortalSearch(browser);
  }

  private browser: Browser;
  private page: Page | null = null;

  constructor(browser: Browser) {
    this.browser = browser;
  }

  private async setupPage() {
    // ToDo:
    // * determine if page is still active and user auth'd, if not
    //   discard the page and restart the setup process
    if (this.page) return;

    this.page = await this.browser.newPage();

    const redirectUrl = await getRedirectUrl(this.page, 5)
    await setForumCookie(this.browser, this.page)

    await this.page.goto(redirectUrl, {
      waitUntil: 'networkidle0'
    });
  }

  async getUserAssets(username: string): Promise<CfxGrantedAsset[]> {
    try {
      await this.setupPage();

      const cookies = await getCookies(this.browser);

      const response = await fetch(
        `https://portal-api.cfx.re/v1/assets/lookup-grants/${username}`,
        {
          headers: {
            Cookie: cookies
          }
        }
      );

      const data = await response.json();

      return data;
    } catch (err) {
      logger.error(`Unable to obtain assets for user: ${username}`);
      logger.error(`Error:`, (err as Error).message);

      throw new Error(`Unable to obtain assets for user: ${username} - Error: ${(err as Error).message}`);
    }
  }

  async closeInstance(): Promise<void> {
    await this.browser.close();
    await this.browser.disconnect();
    logger.info('CfxPortalSearch instance was closed');
  }
}
