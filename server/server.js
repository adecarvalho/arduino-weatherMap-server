const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const fetch = require('node-fetch')

require('dotenv').config()

const arduino = require('./lib/arduino').connect(
	'/dev/cu.usbmodemFD121',
	115200
)

const OPEN_WEATHER_BEGIN = 'http://api.openweathermap.org/data/2.5/weather?q='
const OPEN_WEATHER_END = `&appid=${process.env.OPEN_WEATHER_MAP_KEY}`
const OPEN_WEATHER_LANG_METRIC = '&lang=fr&units=metric'

let weatherDatas = {
	temperature: 0,
	humidite: 0,
	pression: 0,
	eclairement: 0
}

const app = express()

//middlewares
app.use(morgan('tiny'))
app.use(cors())

function getWeather(ville) {
	return fetch(
		OPEN_WEATHER_BEGIN + ville + OPEN_WEATHER_END + OPEN_WEATHER_LANG_METRIC
	)
		.then(res => res.json())
		.then(json => json)
		.catch(error => error)
}

app.get('/api/arduino', (request, response) => {
	response.json({
		...weatherDatas
	})
})

app.get('/api/openweathermap', (request, response) => {
	getWeather('Paris')
		.then(datas => {
			response.json({
				name: datas.name,
				temperature: datas.main.temp,
				description: datas.weather[0].description,
				condition: datas.weather[0].main.toLowerCase()
			})
		})
		.catch(error => {
			response.status(500)
			response.json({
				message: error.message
			})
		})
})

app.get('/api/openweathermap/:ville', (request, response) => {
	const city = request.params.ville

	getWeather(city)
		.then(datas => {
			response.json({
				name: datas.name,
				temperature: datas.main.temp,
				description: datas.weather[0].description,
				condition: datas.weather[0].main.toLowerCase()
			})
		})
		.catch(error => {
			response.status(500)
			response.json({
				message: error.message
			})
		})
})

//
function notFound(request, response, next) {
	const error = new Error('Not Found')
	response.status(404)
	next(error)
}

function errorHandler(error, request, response, next) {
	response.status(response.statusCode || 500)
	response.json({
		message: error.message
	})
}

app.use(notFound)
app.use(errorHandler)

//
const port = process.env.PORT || 5000

app.listen(port, () => {
	console.info('Listing in port ...', port)
})

//arduino datas
arduino.on('serialDatas', datas => {
	//console.log(datas)
	weatherDatas.temperature = datas.temperature
	weatherDatas.humidite = datas.humidite
	weatherDatas.pression = datas.pression
	weatherDatas.eclairement = datas.eclairement
})

//
process.on('SIGINT', () => {
	console.info('Process Exit')
	arduino.stopDatas()
	process.exit()
})
