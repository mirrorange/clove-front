import { useEffect, useState, useCallback } from 'react'
import { Key, RefreshCw, Sliders, Globe, Shield, Check, AlertCircle } from 'lucide-react'
import type { SettingsRead, SettingsUpdate } from '../api/types'
import { settingsApi } from '../api/client'
import './Settings.css'

export function Settings() {
    const [settings, setSettings] = useState<SettingsRead | null>(null)
    const [originalSettings, setOriginalSettings] = useState<SettingsRead | null>(null)
    const [loading, setLoading] = useState(true)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
    const [newApiKey, setNewApiKey] = useState('')
    const [newAdminKey, setNewAdminKey] = useState('')

    const loadSettings = async () => {
        try {
            const response = await settingsApi.get()
            setSettings(response.data)
            setOriginalSettings(response.data)
        } catch (error) {
            console.error('Failed to load settings:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadSettings()
    }, [])

    // 立即保存函数
    const saveChanges = useCallback(
        async (changes: SettingsUpdate) => {
            if (Object.keys(changes).length === 0) return

            setSaveStatus('saving')
            try {
                await settingsApi.update(changes)
                setSaveStatus('saved')

                // 更新原始设置以反映已保存的更改
                if (originalSettings && settings) {
                    setOriginalSettings({ ...originalSettings, ...changes })
                }

                // 3秒后重置状态
                setTimeout(() => setSaveStatus('idle'), 3000)
            } catch (error) {
                console.error('Failed to save settings:', error)
                setSaveStatus('error')
                setTimeout(() => setSaveStatus('idle'), 5000)
            }
        },
        [originalSettings],
    )

    // 更新设置但不保存
    const updateSettings = useCallback((newSettings: SettingsRead) => {
        setSettings(newSettings)
    }, [])

    // 处理字段变化并立即保存
    const handleFieldChange = useCallback(
        async (newSettings: SettingsRead) => {
            setSettings(newSettings)

            if (!originalSettings) return

            // 比较并获取变化的字段
            const changes: SettingsUpdate = {}

            // 检查每个字段的变化
            Object.keys(newSettings).forEach(key => {
                const typedKey = key as keyof SettingsRead
                if (JSON.stringify(newSettings[typedKey]) !== JSON.stringify(originalSettings[typedKey])) {
                    ;(changes as any)[key] = newSettings[typedKey]
                }
            })

            // 如果有变化，立即保存
            if (Object.keys(changes).length > 0) {
                await saveChanges(changes)
            }
        },
        [originalSettings, saveChanges],
    )

    const handleAddApiKey = async () => {
        if (!settings || !newApiKey || settings.api_keys.includes(newApiKey)) return
        const newSettings = {
            ...settings,
            api_keys: [...settings.api_keys, newApiKey],
        }
        await handleFieldChange(newSettings)
        setNewApiKey('')
    }

    const handleRemoveApiKey = async (key: string) => {
        if (!settings) return
        const newSettings = {
            ...settings,
            api_keys: settings.api_keys.filter(k => k !== key),
        }
        await handleFieldChange(newSettings)
    }

    const handleAddAdminKey = async () => {
        if (!settings || !newAdminKey || settings.admin_api_keys.includes(newAdminKey)) return
        const newSettings = {
            ...settings,
            admin_api_keys: [...settings.admin_api_keys, newAdminKey],
        }
        await handleFieldChange(newSettings)
        setNewAdminKey('')
    }

    const handleRemoveAdminKey = async (key: string) => {
        if (!settings) return
        const newSettings = {
            ...settings,
            admin_api_keys: settings.admin_api_keys.filter(k => k !== key),
        }
        await handleFieldChange(newSettings)
    }

    const generateNewKey = (type: 'api' | 'admin') => {
        const key =
            'sk-' +
            Array.from({ length: 48 }, () =>
                'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.charAt(Math.floor(Math.random() * 62)),
            ).join('')

        if (type === 'api') {
            setNewApiKey(key)
        } else {
            setNewAdminKey(key)
        }
    }

    if (loading || !settings) {
        return (
            <div className='loading-container'>
                <div className='loading-content'>
                    <div className='loading-spinner'></div>
                    <p className='loading-text'>加载中...</p>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className='settings-header'>
                <div className='settings-title-container'>
                    <h2 className='settings-title'>应用设置</h2>
                </div>
                <div className='settings-status-container'>
                    {saveStatus === 'saving' && (
                        <div className='status-message status-saving'>
                            <div className='status-spinner'></div>
                            <span className='status-text'>保存中...</span>
                        </div>
                    )}
                    {saveStatus === 'saved' && (
                        <div className='status-message status-saved'>
                            <Check className='status-icon' />
                            <span className='status-text'>已保存</span>
                        </div>
                    )}
                    {saveStatus === 'error' && (
                        <div className='status-message status-error'>
                            <AlertCircle className='status-icon' />
                            <span className='status-text'>保存失败</span>
                        </div>
                    )}
                </div>
            </div>

            <div className='settings-content'>
                {/* API Keys */}
                <div className='settings-section'>
                    <div className='section-header'>
                        <Key className='section-icon' />
                        <h3 className='section-title'>API 密钥</h3>
                    </div>
                    <div>
                        <div className='form-group'>
                            <label className='form-label'>当前 API 密钥列表</label>
                            {settings.api_keys.length === 0 ? (
                                <p className='empty-message'>暂无 API 密钥</p>
                            ) : (
                                <ul className='key-list'>
                                    {settings.api_keys.map((key, index) => (
                                        <li key={index} className='key-list-item'>
                                            <code className='key-code'>{key}</code>
                                            <button
                                                onClick={() => handleRemoveApiKey(key)}
                                                className='delete-button'
                                            >
                                                删除
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className='form-group'>
                            <label htmlFor='new-api-key' className='form-label'>
                                添加新 API 密钥
                            </label>
                            <div className='input-group'>
                                <input
                                    type='text'
                                    id='new-api-key'
                                    className='input-group-input'
                                    value={newApiKey}
                                    onChange={e => setNewApiKey(e.target.value)}
                                    placeholder='输入或生成新密钥'
                                />
                                <button
                                    onClick={() => generateNewKey('api')}
                                    type='button'
                                    className='input-group-button'
                                >
                                    <RefreshCw className='input-group-button-icon' />
                                </button>
                                <button
                                    onClick={handleAddApiKey}
                                    type='button'
                                    className='input-group-action'
                                >
                                    添加
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin Keys */}
                <div className='settings-section'>
                    <div className='section-header'>
                        <Shield className='section-icon' />
                        <h3 className='section-title'>管理员密钥</h3>
                    </div>
                    <div>
                        <div className='form-group'>
                            <label className='form-label'>当前管理员密钥列表</label>
                            {settings.admin_api_keys.length === 0 ? (
                                <p className='empty-message'>暂无管理员密钥</p>
                            ) : (
                                <ul className='key-list'>
                                    {settings.admin_api_keys.map((key, index) => (
                                        <li key={index} className='key-list-item'>
                                            <code className='key-code'>{key}</code>
                                            <button
                                                onClick={() => handleRemoveAdminKey(key)}
                                                className='delete-button'
                                            >
                                                删除
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className='form-group'>
                            <label htmlFor='new-admin-key' className='form-label'>
                                添加新管理员密钥
                            </label>
                            <div className='input-group'>
                                <input
                                    type='text'
                                    id='new-admin-key'
                                    className='input-group-input'
                                    value={newAdminKey}
                                    onChange={e => setNewAdminKey(e.target.value)}
                                    placeholder='输入或生成新密钥'
                                />
                                <button
                                    onClick={() => generateNewKey('admin')}
                                    type='button'
                                    className='input-group-button'
                                >
                                    <RefreshCw className='input-group-button-icon' />
                                </button>
                                <button
                                    onClick={handleAddAdminKey}
                                    type='button'
                                    className='input-group-action'
                                >
                                    添加
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Claude Settings */}
                <div className='settings-section'>
                    <div className='section-header'>
                        <Globe className='section-icon' />
                        <h3 className='section-title'>Claude 配置</h3>
                    </div>
                    <div className='form-grid'>
                        <div className='form-group'>
                            <label htmlFor='claude-ai-url' className='form-label'>
                                Claude AI URL
                            </label>
                            <input
                                type='text'
                                id='claude-ai-url'
                                className='form-input'
                                value={settings.claude_ai_url}
                                onChange={e => updateSettings({ ...settings, claude_ai_url: e.target.value })}
                                onBlur={() => handleFieldChange(settings)}
                            />
                        </div>

                        <div className='form-group'>
                            <label htmlFor='claude-api-baseurl' className='form-label'>
                                Claude API Base URL
                            </label>
                            <input
                                type='text'
                                id='claude-api-baseurl'
                                className='form-input'
                                value={settings.claude_api_baseurl}
                                onChange={e => updateSettings({ ...settings, claude_api_baseurl: e.target.value })}
                                onBlur={() => handleFieldChange(settings)}
                            />
                        </div>

                        <div className='form-group'>
                            <label htmlFor='proxy-url' className='form-label'>
                                代理 URL (可选)
                            </label>
                            <input
                                type='text'
                                id='proxy-url'
                                className='form-input'
                                value={settings.proxy_url || ''}
                                onChange={e => updateSettings({ ...settings, proxy_url: e.target.value || null })}
                                onBlur={() => handleFieldChange(settings)}
                            />
                        </div>
                    </div>
                </div>

                {/* Chat Settings */}
                <div className='settings-section'>
                    <div className='section-header'>
                        <Sliders className='section-icon' />
                        <h3 className='section-title'>聊天设置</h3>
                    </div>
                    <div>
                        <div className='form-group'>
                            <label htmlFor='custom-prompt' className='form-label'>
                                自定义提示词 (可选)
                            </label>
                            <textarea
                                id='custom-prompt'
                                rows={3}
                                className='form-input form-textarea'
                                value={settings.custom_prompt || ''}
                                onChange={e => updateSettings({ ...settings, custom_prompt: e.target.value || null })}
                                onBlur={() => handleFieldChange(settings)}
                            />
                        </div>

                        <div className='form-grid'>
                            <div className='form-group'>
                                <label htmlFor='human-name' className='form-label'>
                                    用户名称
                                </label>
                                <input
                                    type='text'
                                    id='human-name'
                                    className='form-input'
                                    value={settings.human_name}
                                    onChange={e => updateSettings({ ...settings, human_name: e.target.value })}
                                    onBlur={() => handleFieldChange(settings)}
                                />
                            </div>

                            <div className='form-group'>
                                <label htmlFor='assistant-name' className='form-label'>
                                    助手名称
                                </label>
                                <input
                                    type='text'
                                    id='assistant-name'
                                    className='form-input'
                                    value={settings.assistant_name}
                                    onChange={e => updateSettings({ ...settings, assistant_name: e.target.value })}
                                    onBlur={() => handleFieldChange(settings)}
                                />
                            </div>

                            <div className='form-group'>
                                <label htmlFor='padtxt-length' className='form-label'>
                                    Padding 长度
                                </label>
                                <input
                                    type='number'
                                    id='padtxt-length'
                                    className='form-input'
                                    value={settings.padtxt_length}
                                    onChange={e =>
                                        updateSettings({ ...settings, padtxt_length: parseInt(e.target.value) || 0 })
                                    }
                                    onBlur={() => handleFieldChange(settings)}
                                />
                            </div>
                        </div>

                        <div className='checkbox-group'>
                            <label className='checkbox-label'>
                                <input
                                    type='checkbox'
                                    className='checkbox-input'
                                    checked={settings.use_real_roles}
                                    onChange={e => handleFieldChange({ ...settings, use_real_roles: e.target.checked })}
                                />
                                <span className='checkbox-text'>使用真实角色</span>
                            </label>

                            <label className='checkbox-label'>
                                <input
                                    type='checkbox'
                                    className='checkbox-input'
                                    checked={settings.allow_external_images}
                                    onChange={e => handleFieldChange({ ...settings, allow_external_images: e.target.checked })}
                                />
                                <span className='checkbox-text'>允许外部图片</span>
                            </label>

                            <label className='checkbox-label'>
                                <input
                                    type='checkbox'
                                    className='checkbox-input'
                                    checked={settings.preserve_chats}
                                    onChange={e => handleFieldChange({ ...settings, preserve_chats: e.target.checked })}
                                />
                                <span className='checkbox-text'>保存聊天记录</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
