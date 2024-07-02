const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs')
const cors = require('cors')

const app = express()
app.use(bodyParser.json())
app.use(cors())

const dataFilePath = './formData.json'

// Проверка наличия файла и создание его, если не существует
if (!fs.existsSync(dataFilePath)) {
	fs.writeFileSync(
		dataFilePath,
		JSON.stringify({
			formData: {
				step1: { field1: '', field2: '', field3: '' },
				step2: { field4: '', field5: '', field6: '' },
				step3: { field7: '', field8: '', field9: '' },
			},
			lastModified: { userId: '', time: '' },
		}),
		'utf8'
	)
}

app.get('/api/form-data', (req, res) => {
	fs.readFile(dataFilePath, 'utf8', (err, data) => {
		if (err) {
			return res.status(500).send(err)
		}
		res.json(JSON.parse(data))
	})
})

app.post('/api/form-data', (req, res) => {
	const { formData, userId, timestamp } = req.body

	const newData = {
		formData,
		lastModified: { userId, time: timestamp },
	}

	fs.writeFile(dataFilePath, JSON.stringify(newData), 'utf8', err => {
		if (err) {
			return res.status(500).send(err)
		}
		res.json(newData)
	})
})

app.listen(8080, () => {
	console.log('Server is running on port 8080')
})
