import { useEffect, useState } from 'react'
import type { WeatherSettingStore } from '../../../electron/store'
import type {
	ForecastResponse,
	WeatherResponse,
} from '../../api/weather.interface'
import { extractMainColorFromImage } from '../../utils/colorUtils'

interface WeatherComponentProps {
	weather: WeatherResponse
	forecast: ForecastResponse[]
	isDarkMode: boolean
	weatherStore: WeatherSettingStore
}
export function WeatherComponent({
	weather,
	isDarkMode,
	forecast,
	weatherStore,
}: WeatherComponentProps) {
	const [iconColor, setIconColor] = useState('')
	const [isTransparent, setIsTransparent] = useState(false)
	const [isBackgroundActive, setBackgroundActive] = useState<boolean>(false)

	useEffect(() => {
		setIsTransparent(
			document
				.querySelector('.h-screen')
				?.classList?.contains('transparent-active'),
		)

		const observer = new MutationObserver(() => {
			setIsTransparent(
				document
					.querySelector('.h-screen')
					?.classList?.contains('transparent-active'),
			)
		})

		const observerBackground = new MutationObserver(() => {
			setBackgroundActive(
				document.querySelector('.h-screen')?.classList?.contains('background'),
			)
		})

		observer.observe(document.querySelector('.h-screen'), {
			attributes: true,
			attributeFilter: ['class'],
		})
		observerBackground.observe(document.querySelector('.h-screen'), {
			attributes: true,
			attributeFilter: ['class'],
		})

		return () => {
			observer.disconnect()
			observerBackground.disconnect()
		}
	}, [])

	let textColor = 'text-gray-600 text-gray-trasnparent dark:text-[#d3d3d3]'
	if (isTransparent || !isBackgroundActive) {
		textColor = 'text-gray-300'
	}

	useEffect(() => {
		if (weather) {
			extractMainColorFromImage(weather.weather.icon.url).then((color) => {
				setIconColor(color)
			})
		}
	}, [weather])

	return (
		<div className="relative flex flex-col items-center justify-around w-full h-64 px-2">
			<div className="z-10 flex flex-row items-center justify-around w-full">
				<div className="flex items-center justify-center flex-1 h-14 overflow-clip">
					<img
						src={weather.weather.icon.url}
						width={weather.weather.icon.width}
						height={weather.weather.icon.height}
						alt={`${weather.weather.label} ایکون`}
					/>
				</div>
				<div className="relative flex-1 w-20 mt-1 text-2xl text-center truncate">
					<div
						className="z-10 text-gray-trasnparent dark:text-[#eee]"
						style={{
							color:
								isTransparent && !isDarkMode
									? ''
									: adjustColorBasedOnTheme(
											iconColor,
											isDarkMode ? 'dark' : 'light',
										),
						}}
					>
						<span className="text-3xl">
							{Math.floor(weather.weather.temperature.temp)}
						</span>
						<sup className="font-[balooTamma] text-lg">°</sup>
					</div>
				</div>
			</div>
			<div className="z-10 flex flex-col font-bold text-center">
				<div
					className={`w-auto truncate font-normal text-center xs:text-xs sm:text-sm ${textColor}`}
				>
					{weather.weather.temperature.temp_description}
				</div>
				<div className="flex flex-row justify-around py-2 mt-2 font-light rounded-md xs:w-40 sm:w-52 md:w-80 lg:w-96 ">
					{forecast.map((item, index) => {
						return (
							<ForecastComponent
								weather={item}
								key={index}
								isBackgroundActive={isBackgroundActive}
							/>
						)
					})}
				</div>
			</div>
			{weatherStore.stateColor ? (
				<div
					className="absolute z-0 w-full h-24 opacity-50 -bottom-10 blur-2xl dark:opacity-30"
					style={{
						background: `linear-gradient(to bottom, ${iconColor} 0%, ${`${iconColor}00`} 0%, ${iconColor} 100%)`,
					}}
				></div>
			) : null}
		</div>
	)
}
interface ForecastComponentProps {
	weather: {
		temp: number
		icon: string
		date: string
	}
	isBackgroundActive: boolean
}
function ForecastComponent({
	weather,
	isBackgroundActive,
}: ForecastComponentProps) {
	const time = weather.date.split(' ')[1]
	const h = time.split(':')[0]
	const m = time.split(':')[1]

	let textColor = 'text-gray-600 text-gray-trasnparent dark:text-[#d3d3d3]'
	if (!isBackgroundActive) {
		textColor = 'text-gray-300'
	}

	return (
		<div className="flex flex-col items-center justify-around w-full h-10 gap-1 p-1 sm:h-12 sm:w-16 md:h-20 md:px-4 md:w-full lg:h-16 lg:w-60">
			<p
				className={`xs:text-[.60rem] sm:text-[.70rem] md:text-[.90rem] lg:text-[.90rem] xs:w-10 sm:w-14 ${textColor}`}
			>
				{h}:{m}
			</p>
			<img
				src={weather.icon}
				className="xs:w-4 xs:h-4 sm:w-6 sm:h-6 md:w-8 md:h-w-8 lg:w-10 lg:h-10"
			/>
			<p className={`text-[.80rem] w-10 ${textColor}`}>
				{weather.temp.toFixed(0)}
				<sup className="font-[balooTamma] text-[.50rem]">°</sup>
			</p>
		</div>
	)
}

function adjustColorBasedOnTheme(hexColor: string, theme: string) {
	// Generate color based on theme with color
	if (theme === 'light') {
		return hexColor
	}

	// Convert hex to RGB
	const color = hexColor.replace('#', '')
	const r = Number.parseInt(color.substring(0, 2), 16)
	const g = Number.parseInt(color.substring(2, 4), 16)
	const b = Number.parseInt(color.substring(4, 6), 16)

	// Darken the color for the dark theme
	const factor = 3.7 // Adjust this factor to control the darkness
	const darken = (value: number) =>
		Math.max(0, Math.min(255, Math.floor(value * factor + 70)))

	const darkR = darken(r)
	const darkG = darken(g)
	const darkB = darken(b)

	// Convert RGB back to hex
	const toHex = (value: number) => value.toString(16).padStart(2, '0')
	const darkHexColor = `#${toHex(darkR)}${toHex(darkG)}${toHex(darkB)}`

	return darkHexColor
}
