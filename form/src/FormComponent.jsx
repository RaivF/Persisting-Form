import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios' // Импорт для работы с HTTP запросами
import { openDB } from 'idb' // Импорт для работы с IndexedDB
import './form.css' // Стили для компонента

// Константы для работы с IndexedDB
const DB_NAME = 'formDB'
const STORE_NAME = 'formData'
const DB_VERSION = 1

const FormComponent = () => {
	// Состояния компонента
	const [formData, setFormData] = useState({
		step1: { field1: '', field2: '', field3: '' }, // Данные для первого шага
		step2: { field4: '', field5: '', field6: '' }, // Данные для второго шага
		step3: { field7: '', field8: '', field9: '' }, // Данные для третьего шага
	})
	const [currentStep, setCurrentStep] = useState(1) // Текущий активный шаг
	const [loading, setLoading] = useState(true) // Состояние загрузки
	const [error, setError] = useState(null) // Ошибка при загрузке данных
	const [success, setSuccess] = useState(null) // Успешное сохранение данных
	const [userId, setUserId] = useState(null) // Идентификатор пользователя
	const [lastModified, setLastModified] = useState({ userId: '', time: '' }) // Последние изменения

	// URL для отправки и получения данных
	const URL = 'http://localhost:8080/api/form-data'

	// Реф для таймаута дебаунса
	const debounceTimeoutRef = useRef(null)
	// Реф для таймаута повтора сохранения
	const retryTimeoutRef = useRef(null)

	// Эффект для инициализации IndexedDB при загрузке компонента
	useEffect(() => {
		const initDB = async () => {
			const db = await openDB(DB_NAME, DB_VERSION, {
				upgrade(db) {
					if (!db.objectStoreNames.contains(STORE_NAME)) {
						db.createObjectStore(STORE_NAME)
					}
				},
			})
			const tx = db.transaction(STORE_NAME, 'readonly')
			const store = tx.objectStore(STORE_NAME)
			const data = await store.get('formData')
			const storedUserId = await store.get('userId')
			if (data) {
				setFormData(data.formData || formData)
				setLastModified(data.lastModified || { userId: '', time: '' })
			}
			if (storedUserId) {
				setUserId(storedUserId)
			}
		}
		initDB().then(() => setLoading(false)) // Завершение загрузки после инициализации
	}, [])

	// Эффект для загрузки данных с сервера при изменении userId
	useEffect(() => {
		if (userId) {
			axios
				.get(URL)
				.then(response => {
					if (response.data) {
						setFormData(response.data.formData)
						setLastModified(response.data.lastModified)
						saveToIndexedDB('formData', response.data)
					}
				})
				.catch(error => {
					console.error('Error fetching form data:', error)
					setError(true)
				})
				.finally(() => setLoading(false))
		}
	}, [userId])

	// Функция для сохранения данных в IndexedDB
	const saveToIndexedDB = async (key, data) => {
		const db = await openDB(DB_NAME, DB_VERSION)
		const tx = db.transaction(STORE_NAME, 'readwrite')
		const store = tx.objectStore(STORE_NAME)
		await store.put(data, key)
		await tx.done
	}

	// Эффект для очистки таймеров при размонтировании компонента
	useEffect(() => {
		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current)
			}
			if (retryTimeoutRef.current) {
				clearTimeout(retryTimeoutRef.current)
			}
		}
	}, [])

	// Функция для обработки сохранения данных с дебаунсом
	const handleSave = data => {
		const timestamp = new Date().toISOString()
		const dataWithMeta = { formData: data, userId, timestamp }

		saveToIndexedDB('formData', dataWithMeta)
		axios
			.post(URL, dataWithMeta)
			.then(response => {
				console.log('Form data saved:', response.data)
				setError(null)
				setSuccess(true)
				setLastModified({ userId, time: timestamp })
				setTimeout(() => setSuccess(false), 2000)
			})
			.catch(error => {
				console.error('Error saving form data:', error)
				setError(true)
				setSuccess(false)
				scheduleRetry(dataWithMeta)
			})
	}

	// Функция для запланированного повтора сохранения при ошибке
	const scheduleRetry = data => {
		if (retryTimeoutRef.current) {
			clearTimeout(retryTimeoutRef.current)
		}
		retryTimeoutRef.current = setTimeout(() => {
			handleSave(data)
		}, 30000)
	}

	// Функция для создания дебаунса
	const debounce = (func, delay) => {
		return function (...args) {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current)
			}
			debounceTimeoutRef.current = setTimeout(() => {
				func.apply(this, args)
			}, delay)
		}
	}

	// Дебаунсированная функция сохранения данных
	const debouncedSave = debounce(handleSave, 1000)

	// Обработчик изменений в полях ввода формы
	const handleChange = e => {
		const { name, value } = e.target
		const step = `step${currentStep}`
		const newFormData = {
			...formData,
			[step]: { ...formData[step], [name]: value },
		}
		setFormData(newFormData)
		debouncedSave(newFormData) // Сохранение с дебаунсом
	}

	// Функция для перехода на следующий шаг
	const nextStep = () => {
		setCurrentStep(prev => Math.min(prev + 1, 3))
	}

	// Функция для перехода на предыдущий шаг
	const prevStep = () => {
		setCurrentStep(prev => Math.max(prev - 1, 1))
	}

	// Обработчик отправки userId для начала работы с формой
	const handleUserIdSubmit = e => {
		e.preventDefault()
		const inputUserId = e.target.elements.userId.value
		setUserId(inputUserId) // Установка userId
		saveToIndexedDB('userId', inputUserId) // Сохранение userId в IndexedDB
	}

	// Функция для форматирования даты и времени
	const formatDateTime = dateString => {
		const date = new Date(dateString)
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		const seconds = String(date.getSeconds()).padStart(2, '0')
		return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`
	}

	// Отображение загрузочного экрана
	if (loading) {
		return <div>Loading...</div>
	}

	// Отображение формы для ввода userId, если он не установлен
	if (!userId) {
		return (
			<form onSubmit={handleUserIdSubmit}>
				<label>
					Введите ваше имя:
					<input type='text' name='userId' required />
				</label>
				<button type='submit'>Продолжить</button>
			</form>
		)
	}

	// Основное отображение формы
	return (
		<div>
			{/* Отображение сообщения об ошибке при отсутствии соединения */}
			{error && (
				<div className='offline-warning'>
					Отсутствует соединение с сервером, данные будут сохранены локально.
					<p>Автоматическая попытка соединения...</p>
				</div>
			)}
			{/* Отображение сообщения об успешном сохранении */}
			{success && <div className='success-message'>Сохранено</div>}
			{/* Форма для ввода данных */}
			<form>
				{/* Отображение полей формы в зависимости от текущего шага */}
				{currentStep === 1 && (
					<>
						<label>
							Поле 1:
							<input
								type='text'
								name='field1'
								value={formData.step1.field1}
								onChange={handleChange}
							/>
						</label>
						<label>
							Поле 2:
							<input
								type='text'
								name='field2'
								value={formData.step1.field2}
								onChange={handleChange}
							/>
						</label>
						<label>
							Поле 3:
							<input
								type='text'
								name='field3'
								value={formData.step1.field3}
								onChange={handleChange}
							/>
						</label>
					</>
				)}
				{currentStep === 2 && (
					<>
						<label>
							Поле 4:
							<input
								type='text'
								name='field4'
								value={formData.step2.field4}
								onChange={handleChange}
							/>
						</label>
						<label>
							Поле 5:
							<input
								type='text'
								name='field5'
								value={formData.step2.field5}
								onChange={handleChange}
							/>
						</label>
						<label>
							Поле 6:
							<input
								type='text'
								name='field6'
								value={formData.step2.field6}
								onChange={handleChange}
							/>
						</label>
					</>
				)}
				{currentStep === 3 && (
					<>
						<label>
							Поле 7:
							<input
								type='text'
								name='field7'
								value={formData.step3.field7}
								onChange={handleChange}
							/>
						</label>
						<label>
							Поле 8:
							<input
								type='text'
								name='field8'
								value={formData.step3.field8}
								onChange={handleChange}
							/>
						</label>
						<label>
							Поле 9:
							<input
								type='text'
								name='field9'
								value={formData.step3.field9}
								onChange={handleChange}
							/>
						</label>
					</>
				)}
			</form>
			{/* Навигационные кнопки для перехода по шагам */}
			<div className='navigation-buttons'>
				<button type='button' onClick={prevStep} disabled={currentStep === 1}>
					Назад
				</button>
				<button type='button' onClick={nextStep} disabled={currentStep === 3}>
					Далее
				</button>
			</div>
			{/* Отображение информации о последних изменениях */}
			<div className='last-modified'>
				<p>Последние изменения внес: {lastModified.userId}</p>
				<p>Время последнего изменения: {formatDateTime(lastModified.time)}</p>
			</div>
		</div>
	)
}

export default FormComponent
