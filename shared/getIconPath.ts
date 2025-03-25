import path from 'node:path'

export function getIconPath(): string {
	let icon: string
	if (process.env.PUBLIC)
		switch (process.platform) {
			case 'win32':
				icon = path.join(process.env.PUBLIC, 'icons/app/win/icon.ico')
				break
			case 'linux':
				icon = path.join(process.env.PUBLIC, 'icons/app/mac/icon.icns')
				break
			default:
				icon = path.join(process.env.PUBLIC, 'icons/app/png/24x24.ico')
				break
		}
	return icon || ''
}

export function getPublicFilePath(filePath: string): string {
	return path.join(process.env.PUBLIC as string, filePath)
}
