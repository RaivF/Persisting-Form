import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { openDB } from 'idb'
import './form.css'

const DB_NAME = 'formDB'
const STORE_NAME = 'formData'
const DB_VERSION = 1

const FormComponent = () => {
	const [formData, setFormData] = useState({
		step1: { field1: '', field2: '', field3: '' },
		step2: { field4: '', field5: '', field6: '' },
		step3: { field7: '', field8: '', field9: '' },
	})
	const [currentStep, setCurrentStep] = useState(1)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState(null)
	const [success, setSuccess] = useState(null)
	const URL = 'http://localhost:8080/api/form-data'
	const debounceTimeoutRef = useRef(null)
	const retryTimeoutRef = useRef(null)

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
			if (data) {
				setFormData(data)
			}
		}
		initDB().then(() => setLoading(false))
	}, [])

	useEffect(() => {
		axios
			.get(URL)
			.then(response => {
				if (response.data) {
					setFormData(response.data)
					saveToIndexedDB(response.data)
				}
			})
			.catch(error => {
				console.error('Error fetching form data:', error)
				setError(true)
			})
			.finally(() => setLoading(false))
	}, [])

	const saveToIndexedDB = async data => {
		const db = await openDB(DB_NAME, DB_VERSION)
		const tx = db.transaction(STORE_NAME, 'readwrite')
		const store = tx.objectStore(STORE_NAME)
		await store.put(data, 'formData')
		await tx.done
	}

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

	const handleSave = data => {
		saveToIndexedDB(data)
		axios
			.post(URL, data)
			.then(response => {
				console.log('Form data saved:', response.data)
				setError(null)
				setSuccess(true)
				setTimeout(() => setSuccess(false), 2000)
			})
			.catch(error => {
				console.error('Error saving form data:', error)
				setError(true)
				setSuccess(false)
				scheduleRetry(data)
			})
	}

	const scheduleRetry = data => {
		if (retryTimeoutRef.current) {
			clearTimeout(retryTimeoutRef.current)
		}
		retryTimeoutRef.current = setTimeout(() => {
			handleSave(data)
		}, 5000)
	}

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

	const debouncedSave = debounce(handleSave, 1000)

	const handleChange = e => {
		const { name, value } = e.target
		const step = `step${currentStep}`
		const newFormData = {
			...formData,
			[step]: { ...formData[step], [name]: value },
		}
		setFormData(newFormData)
		debouncedSave(newFormData)
	}

	const nextStep = () => {
		setCurrentStep(prev => Math.min(prev + 1, 3))
	}

	const prevStep = () => {
		setCurrentStep(prev => Math.max(prev - 1, 1))
	}

	if (loading) {
		return <div>Loading...</div>
	}

	return (
		<div>
			{error && (
				<div className='offline-warning'>
					Отсутствует соединение с сервером, данные будут сохранены локально.
					<p>автоматическая попытка соединения . . .</p>
				</div>
			)}
			{success && <div className='success-message'>сохранено</div>}
			<form>
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
			<div className='navigation-buttons'>
				<button type='button' onClick={prevStep} disabled={currentStep === 1}>
					Назад
				</button>
				<button type='button' onClick={nextStep} disabled={currentStep === 3}>
					Далее
				</button>
			</div>
		</div>
	)
}

export default FormComponent
