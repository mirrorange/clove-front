import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { statisticsApi } from '../api/client'
import './Login.css'

export function Login() {
    const [adminKey, setAdminKey] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // 保存 admin key
            localStorage.setItem('adminKey', adminKey)

            // 使用 statistics API 验证 Admin Key
            await statisticsApi.get()

            // 成功则跳转
            navigate('/')
        } catch (err) {
            setError('Admin Key 无效或服务器连接失败')
            localStorage.removeItem('adminKey')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='login-container'>
            <div className='login-box'>
                <div className='login-header'>
                    <h2 className='login-title'>登录到 Clove</h2>
                </div>
                <form className='login-form' onSubmit={handleSubmit}>
                    <div className='form-group'>
                        <div>
                            <label htmlFor='admin-key' className='sr-only'>
                                Admin Key
                            </label>
                            <div className='input-wrapper'>
                                <div className='input-icon-wrapper'>
                                    <KeyRound className='input-icon' />
                                </div>
                                <input
                                    id='admin-key'
                                    name='admin-key'
                                    type='password'
                                    required
                                    className='login-input'
                                    placeholder='输入 Admin Key'
                                    value={adminKey}
                                    onChange={e => setAdminKey(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className='error-message'>
                            <p className='error-text'>{error}</p>
                        </div>
                    )}

                    <div>
                        <button
                            type='submit'
                            disabled={loading}
                            className='submit-button'
                        >
                            {loading ? '登录中...' : '登录'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
