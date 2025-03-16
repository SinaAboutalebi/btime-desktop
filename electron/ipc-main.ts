import { BrowserWindow, app, ipcMain, nativeTheme, shell } from 'electron'
import { userLogger } from '../shared/logger'
import { widgetKey } from '../shared/widgetKey'
import { type MainSettingStore, store, type windowSettings } from './store'
import { createSettingWindow, createWindow } from './window'

export function initIpcMain() {
	ipcMain.on('reOpen', () => {
		app.relaunch()
		app.exit()
	})

	ipcMain.on('changeTheme', (event, theme: MainSettingStore['theme']) => {
		nativeTheme.themeSource = theme
	})

	ipcMain.on('openSettingWindow', () => {
		createSettingWindow()
	})

	ipcMain.on('open-url', (event, url: string) => {
		shell.openExternal(url)
	})

	ipcMain.on('toggle-transparent', (event, windowKey: string) => {
		const win = BrowserWindow.getAllWindows().filter(
			(win) => win.title === windowKey,
		)[0]
		if (win) {
			win.webContents.send('transparent_status', {
				enableTransparent: (
					store.get(widgetKey[windowKey]) as unknown as windowSettings
				).transparentStatus,
			})
		}
	})

	ipcMain.on('toggle-isBackgroundDisabled', (event, windowKey: string) => {
		const win = BrowserWindow.getAllWindows().filter(
			(win) => win.title === windowKey,
		)[0]
		if (win) {
			const isBackgroundDisabled = (
				store.get(widgetKey[windowKey]) as unknown as windowSettings
			).isBackgroundDisabled

			win.webContents.send('background_status', {
				isBackgroundDisabled: isBackgroundDisabled,
			})
		}
	})

	ipcMain.handle('getBorderRadius', async (event, window: string) => {
		try {
			const win = BrowserWindow.getAllWindows().filter(
				(win) => win.title === window,
			)[0]
			const borderRadius = await win.webContents.executeJavaScript(`
 getComputedStyle(document.querySelector('.h-screen')).borderRadius
  `)

			return borderRadius
		} catch (error) {
			userLogger.error(`Error in getBorderRadius: ${error}`)
			return ''
		}
	})

	ipcMain.handle(
		'setBorderRadius',
		async (event, window: string, value: string) => {
			const win = BrowserWindow.getAllWindows().filter(
				(win) => win.title === window,
			)[0]

			await win.webContents.executeJavaScript(
				`
        document.querySelector('.h-screen').style.borderRadius = '${value}'
        `,
				true,
			)
		},
	)

	ipcMain.on('updated-setting', async (event, windowKey: string) => {
		const win = BrowserWindow.getAllWindows().filter(
			(win) => win.title === windowKey,
		)[0]
		if (win) {
			win.webContents.send('updated-setting')
		}
	})

	ipcMain.on('toggle-enable', async (event, windowKey: string) => {
		userLogger.info(`Toggle enable for ${windowKey}`)
		const win = BrowserWindow.getAllWindows().filter(
			(win) => win.title === windowKey,
		)[0]
		const setting = store.get(widgetKey[windowKey]) as unknown as windowSettings
		const moveable = store.get('main').moveable
		if (!setting) {
			userLogger.error(`Setting not found for ${windowKey}`)
			return
		}
		if (!setting.enable) {
			if (win) {
				try {
					userLogger.info(`Attempting to close ${windowKey}`)
					win.destroy()
					userLogger.info(`Successfully closed ${windowKey}`)
				} catch (error) {
					userLogger.error(`Failed to close ${windowKey}: ${error}`)
					if (!win.isDestroyed()) {
						win.webContents.closeDevTools()
						win.hide()
						setImmediate(() => {
							if (!win.isDestroyed()) {
								win.close()
							}
						})
					}
				}
			} else {
				userLogger.error(`Window not found for ${windowKey}`)
			}
		} else {
			await createWindow({
				height: setting.bounds.height,
				width: setting.bounds.width,
				minHeight: setting.bounds.minHeight,
				minWidth: setting.bounds.minWidth,
				maxHeight: setting.bounds.maxHeight,
				maxWidth: setting.bounds.maxWidth,
				x: setting.bounds.x,
				y: setting.bounds.y,
				title: windowKey,
				html: setting.html,
				devTools: true,
				alwaysOnTop: setting.alwaysOnTop,
				reziable: true,
				saveBounds: true,
				moveable,
			})
			userLogger.info(`Widget ${windowKey} enabled`)
		}
	})

	ipcMain.on('reset-setting', async (event) => {
		const mainSetting = store.get('main')

		store.clear()

		const newMainSetting = store.get('main')

		store.set('main', {
			...newMainSetting,
			currentVersion: mainSetting.currentVersion,
			userId: mainSetting.userId,
		} as MainSettingStore)

		app.relaunch()
		app.exit()
	})
}
