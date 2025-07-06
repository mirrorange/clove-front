import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp } from 'lucide-react'
import type { AccountResponse, AccountCreate, AccountUpdate } from '../api/types'
import { accountsApi } from '../api/client'
import './AccountModal.css'

interface AccountModalProps {
    account: AccountResponse | null
    onClose: () => void
}

export function AccountModal({ account, onClose }: AccountModalProps) {
    const [formData, setFormData] = useState({
        cookie_value: '',
        oauth_access_token: '',
        oauth_refresh_token: '',
        oauth_expires_at: '',
        organization_uuid: '',
        capabilities: [] as string[],
    })
    const [accountType, setAccountType] = useState<'' | 'Normal' | 'Pro' | 'Max'>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)

    useEffect(() => {
        if (account) {
            setFormData({
                cookie_value: '',
                oauth_access_token: '',
                oauth_refresh_token: '',
                oauth_expires_at: '',
                organization_uuid: account.organization_uuid,
                capabilities: account.capabilities || [],
            })

            // 根据现有能力确定账户类型
            const caps = account.capabilities || []
            if (caps.length === 0) {
                setAccountType('')
            } else if (caps.includes('claude_max')) {
                setAccountType('Max')
            } else if (caps.includes('claude_pro')) {
                setAccountType('Pro')
            } else {
                setAccountType('Normal')
            }
        }
    }, [account])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // 根据账户类型设置能力列表
        let capabilities: string[] | undefined
        switch (accountType) {
            case 'Normal':
                capabilities = ['chat']
                break
            case 'Pro':
                capabilities = ['chat', 'claude_pro']
                break
            case 'Max':
                capabilities = ['chat', 'claude_max']
                break
            case '':
                capabilities = undefined
                break
        }

        try {
            if (account) {
                // 更新账户
                const updateData: AccountUpdate = {}

                if (formData.cookie_value && formData.cookie_value !== account.cookie_value) {
                    updateData.cookie_value = formData.cookie_value
                }

                if (formData.oauth_access_token && formData.oauth_refresh_token && formData.oauth_expires_at) {
                    updateData.oauth_token = {
                        access_token: formData.oauth_access_token,
                        refresh_token: formData.oauth_refresh_token,
                        expires_at: parseFloat(formData.oauth_expires_at),
                    }
                }

                if (capabilities) {
                    updateData.capabilities = capabilities
                }

                await accountsApi.update(account.organization_uuid, updateData)
            } else {
                // 创建新账户
                const createData: AccountCreate = {}

                if (formData.cookie_value) {
                    createData.cookie_value = formData.cookie_value
                }

                if (formData.oauth_access_token && formData.oauth_refresh_token && formData.oauth_expires_at) {
                    createData.oauth_token = {
                        access_token: formData.oauth_access_token,
                        refresh_token: formData.oauth_refresh_token,
                        expires_at: parseFloat(formData.oauth_expires_at),
                    }
                }

                if (formData.organization_uuid) {
                    createData.organization_uuid = formData.organization_uuid
                }

                if (capabilities) {
                    createData.capabilities = capabilities
                }

                await accountsApi.create(createData)
            }

            onClose()
        } catch (err: any) {
            setError(err.response?.data?.detail || '操作失败')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='modal-overlay'>
            <div className='modal-container'>
                <div className='modal-backdrop' onClick={onClose} />

                <span className='modal-helper'>&#8203;</span>

                <div className='modal-dialog'>
                    <form onSubmit={handleSubmit}>
                        <div className='modal-content'>
                            <div className='modal-header'>
                                <h3 className='modal-title'>
                                    {account ? '编辑账户' : '添加 Cookie'}
                                </h3>
                                <button
                                    type='button'
                                    className='modal-close'
                                    onClick={onClose}
                                >
                                    <X className='modal-close-icon' />
                                </button>
                            </div>

                            <div>
                                <div className='form-field'>
                                    <label htmlFor='cookie_value' className='form-label'>
                                        Cookie <span className='required-star'>*</span>
                                    </label>
                                    <textarea
                                        id='cookie_value'
                                        rows={3}
                                        className='form-textarea'
                                        value={formData.cookie_value}
                                        onChange={e => setFormData({ ...formData, cookie_value: e.target.value })}
                                        placeholder='粘贴您的 Claude Cookie...'
                                        required
                                    />
                                </div>

                                <div className='advanced-section'>
                                    <button
                                        type='button'
                                        className='advanced-toggle'
                                        onClick={() => setShowAdvanced(!showAdvanced)}
                                    >
                                        <span>高级选项</span>
                                        {showAdvanced ? <ChevronUp className='advanced-icon' /> : <ChevronDown className='advanced-icon' />}
                                    </button>

                                    {showAdvanced && (
                                        <div className='advanced-content'>
                                            {!account && (
                                                <div className='form-field'>
                                                    <label
                                                        htmlFor='organization_uuid'
                                                        className='form-label'
                                                    >
                                                        Organization UUID
                                                    </label>
                                                    <input
                                                        type='text'
                                                        id='organization_uuid'
                                                        className='form-input'
                                                        value={formData.organization_uuid}
                                                        onChange={e =>
                                                            setFormData({ ...formData, organization_uuid: e.target.value })
                                                        }
                                                        placeholder='留空自动获取'
                                                    />
                                                </div>
                                            )}

                                            <div className='form-field'>
                                                <label
                                                    htmlFor='accountType'
                                                    className='form-label'
                                                >
                                                    账户类型
                                                </label>
                                                <select
                                                    id='accountType'
                                                    className='form-select'
                                                    value={accountType}
                                                    onChange={e =>
                                                        setAccountType(e.target.value as '' | 'Normal' | 'Pro' | 'Max')
                                                    }
                                                >
                                                    <option value=''>未选择</option>
                                                    <option value='Normal'>普通</option>
                                                    <option value='Pro'>Pro</option>
                                                    <option value='Max'>Max</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className='error-message'>
                                        <p className='error-text'>{error}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className='modal-footer'>
                            <button
                                type='submit'
                                disabled={loading || !formData.cookie_value.trim()}
                                className='btn-primary'
                            >
                                {loading ? '保存中...' : '保存'}
                            </button>
                            <button
                                type='button'
                                className='btn-secondary'
                                onClick={onClose}
                            >
                                取消
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
