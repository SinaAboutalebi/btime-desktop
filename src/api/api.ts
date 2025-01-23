import axios from 'axios'
import type { News, Timezone, TodayEvent } from './api.interface'
import type { ForecastResponse, WeatherResponse } from './weather.interface'

const api = axios.create()
const rawGithubApi = axios.create({
	baseURL: 'https://raw.githubusercontent.com/sajjadmrx/btime-desktop/main',
})

export interface CurrencyData {
	name: {
		fa: string
		en: string
	}
	icon: string
	price: number
	rialPrice: number
}

export interface History {
	date: string
	price: number
	rate: string
	low: number
	high: number
}

export async function getRateByCurrency(
	currency: string,
): Promise<CurrencyData | null> {
	try {
		api.defaults.baseURL = await getMainApi()

		api.defaults.headers.userid = window.store.get('main').userId

		const response = await api.get(`/v2/arz/${currency}`)
		return response.data
	} catch (err) {
		console.log(err)
		return null
	}
}

export type SupportedCurrencies = {
	key: string
	type: 'coin' | 'crypto' | 'currency'
	country?: string
	label: {
		fa: string
		en: string
	}
}[]

export async function getSupportedCurrencies(): Promise<SupportedCurrencies> {
	try {
		api.defaults.baseURL = await getMainApi()

		api.defaults.headers.userid = window.store.get('main').userId

		const response = await api.get('/v2/supported-currencies')
		return response.data.currencies
	} catch (err) {
		console.log(err)
		return []
	}
}

export async function getWeatherByCity(
	city: string,
): Promise<WeatherResponse | null> {
	try {
		api.defaults.baseURL = await getMainApi()

		api.defaults.headers.userid = window.store.get('main').userId

		const response = await api.get(`/weather/current?city=${city}`)
		return response.data
	} catch (err) {
		console.log(err)
		return null
	}
}

export async function getWeatherByLatLon(
	lat: number,
	lon: number,
): Promise<WeatherResponse | null> {
	api.defaults.baseURL = await getMainApi()

	api.defaults.headers.userid = window.store.get('main').userId

	const response = await api.get(`/weather/current?lat=${lat}&lon=${lon}`)
	return response.data
}

export async function getWeatherForecastByLatLon(
	lat: number,
	lon: number,
): Promise<ForecastResponse[]> {
	try {
		api.defaults.baseURL = await getMainApi()

		api.defaults.headers.userid = window.store.get('main').userId

		const response = await api.get(`/weather/forecast?lat=${lat}&lon=${lon}`)
		return response.data
	} catch {
		return []
	}
}

export async function getRelatedCities(city: string): Promise<any[]> {
	try {
		api.defaults.baseURL = await getMainApi()

		api.defaults.headers.userid = window.store.get('main').userId

		const response = await api.get(`/weather/direct?q=${city}`)
		return response.data
	} catch (err) {
		console.log(err)
		return []
	}
}

export async function getSponsors() {
	api.defaults.baseURL = await getMainApi()

	api.defaults.headers.userid = window.store.get('main').userId

	const response = await api.get('/sponsors')
	return response.data
}

export interface MonthEvent {
	date: string
	event: string
	isHoliday: boolean
	day: string
}
export async function getMonthEvents(): Promise<MonthEvent[]> {
	api.defaults.baseURL = await getMainApi()
	try {
		api.defaults.headers.userid = window.store.get('main').userId

		const response = await api.get('/date/month')
		return response.data
	} catch {
		return []
	}
}

export async function getTimezones(): Promise<Timezone[]> {
	try {
		api.defaults.baseURL = await getMainApi()

		api.defaults.headers.userid = window.store.get('main').userId

		const response = await api.get('/date/timezones')
		return response.data
	} catch {
		return []
	}
}
export async function getNotifications() {
	try {
		api.defaults.baseURL = await getMainApi()

		api.defaults.headers.userid = window.store.get('main').userId

		const response = await api.get('/notifications')
		return response.data
	} catch {
		return null
	}
}

export async function getTodayEvents(): Promise<TodayEvent[]> {
	try {
		api.defaults.baseURL = await getMainApi()

		api.defaults.headers.userid = window.store.get('main').userId

		const response = await api.get<{
			todayEvents: TodayEvent[]
		}>('/date/todoy-events')
		return response.data.todayEvents
	} catch {
		return []
	}
}

export async function getOurNews(): Promise<News[]> {
	try {
		api.defaults.baseURL = await getMainApi()

		api.defaults.headers.userid = window.store.get('main').userId

		const response = await api.get('/news')
		return response.data
	} catch {
		return []
	}
}

export async function getAppLogo(): Promise<string | null> {
	try {
		api.defaults.baseURL = await getMainApi()
		const response = await api.get('/logo')
		return response.data
	} catch {
		return null
	}
}

export async function getMainApi(): Promise<string> {
	if (import.meta.env.VITE_API) {
		return import.meta.env.VITE_API
	}

	const urlResponse = await rawGithubApi.get('/.github/api.txt')
	return urlResponse.data
}

interface EventData {
	name: string //ex: 'setting_theme'
	value: any //ex: 'dark'
	widget: string
	attchment?: any
}
let MAIN_API = null
export async function sendEvent(data: EventData) {
	try {
		const store = await window.store.get('main')
		if (!store.enableAnalytics) return

		if (!MAIN_API) {
			MAIN_API = await getMainApi()
		}

		api.defaults.baseURL = MAIN_API

		data.attchment = {
			...data.attchment,
			userAgent: navigator.userAgent,
			userId: store.userId,
		}

		api.defaults.headers.userid = window.store.get('main').userId

		await api.post('/analytics', data)

		return true
	} catch (err) {
		return false
	}
}
