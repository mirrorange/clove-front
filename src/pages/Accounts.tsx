import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Cookie, Shield, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { AccountResponse } from '../api/types'
import { accountsApi } from '../api/client'
import { AccountModal } from '../components/AccountModal'
import './Accounts.css'

export function Accounts() {
    const [accounts, setAccounts] = useState<AccountResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState<AccountResponse | null>(null)

    const loadAccounts = async () => {
        try {
            const response = await accountsApi.list()
            setAccounts(response.data)
        } catch (error) {
            console.error('Failed to load accounts:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadAccounts()
    }, [])

    const handleDelete = async (organizationUuid: string) => {
        if (!confirm('确定要删除这个账户吗？')) return

        try {
            await accountsApi.delete(organizationUuid)
            await loadAccounts()
        } catch (error) {
            console.error('Failed to delete account:', error)
            alert('删除账户失败')
        }
    }

    const handleEdit = (account: AccountResponse) => {
        setEditingAccount(account)
        setModalOpen(true)
    }

    const handleAdd = () => {
        setEditingAccount(null)
        setModalOpen(true)
    }

    const handleModalClose = () => {
        setModalOpen(false)
        setEditingAccount(null)
        loadAccounts()
    }

    const getAuthTypeIcon = (authType: string) => {
        return authType === 'both' ? <Shield className='icon-small' /> : <Cookie className='icon-small' />
    }

    const getAuthTypeName = (authType: string) => {
        switch (authType) {
            case 'cookie_only':
                return 'Cookie'
            case 'oauth_only':
                return 'OAuth'
            case 'both':
                return 'Cookie + OAuth'
            default:
                return authType
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'valid':
                return <CheckCircle className='icon-small status-valid' />
            case 'invalid':
                return <XCircle className='icon-small status-invalid' />
            case 'rate_limited':
                return <AlertCircle className='icon-small status-rate-limited' />
            default:
                return null
        }
    }

    const getStatusName = (status: string) => {
        switch (status) {
            case 'valid':
                return '正常'
            case 'invalid':
                return '无效'
            case 'rate_limited':
                return '限流中'
            default:
                return status
        }
    }

    if (loading) {
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
            <div className='accounts-header'>
                <div className='accounts-header-content'>
                    <h1 className='accounts-title'>账户管理</h1>
                    <p className='accounts-subtitle'>管理 Claude 账户，支持 Cookie 和 OAuth 认证方式</p>
                </div>
                <div className='accounts-actions'>
                    <button
                        onClick={handleAdd}
                        className='add-account-btn'
                    >
                        <Plus />
                        添加 Cookie
                    </button>
                </div>
            </div>

            <div className='accounts-table-wrapper'>
                <div className='accounts-table-scroll'>
                    <div className='accounts-table-container'>
                        <div className='accounts-table-shadow'>
                            <table className='accounts-table'>
                                <thead>
                                    <tr>
                                        <th scope='col'>
                                            Organization UUID
                                        </th>
                                        <th scope='col'>
                                            认证方式
                                        </th>
                                        <th scope='col'>
                                            状态
                                        </th>
                                        <th scope='col'>
                                            账户类型
                                        </th>
                                        <th scope='col'>
                                            最后使用
                                        </th>
                                        <th scope='col'>
                                            重置时间
                                        </th>
                                        <th scope='col'>
                                            <span className='sr-only'>操作</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className='empty-state'>
                                                暂无账户，点击"添加账户"创建第一个账户
                                            </td>
                                        </tr>
                                    ) : (
                                        accounts.map(account => (
                                            <tr key={account.organization_uuid}>
                                                <td className='account-uuid'>
                                                    {account.organization_uuid}
                                                </td>
                                                <td>
                                                    <span className='auth-type-badge'>
                                                        {getAuthTypeIcon(account.auth_type)}
                                                        <span>{getAuthTypeName(account.auth_type)}</span>
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className='status-indicator'>
                                                        {getStatusIcon(account.status)}
                                                        <span>{getStatusName(account.status)}</span>
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className='account-type'>
                                                        {account.is_max ? (
                                                            <span className='account-type-badge max'>
                                                                Max
                                                            </span>
                                                        ) : account.is_pro ? (
                                                            <span className='account-type-badge pro'>
                                                                Pro
                                                            </span>
                                                        ) : (
                                                            <span className='account-type-free'>Free</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className='date-cell'>
                                                    {new Date(account.last_used).toLocaleString('zh-CN')}
                                                </td>
                                                <td className='date-cell'>
                                                    {account.resets_at
                                                        ? new Date(account.resets_at).toLocaleString('zh-CN')
                                                        : '-'}
                                                </td>
                                                <td className='actions-cell'>
                                                    <button
                                                        onClick={() => handleEdit(account)}
                                                        className='edit-btn'
                                                    >
                                                        <Pencil />
                                                        <span>编辑</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(account.organization_uuid)}
                                                        className='delete-btn'
                                                    >
                                                        <Trash2 />
                                                        <span>删除</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {modalOpen && <AccountModal account={editingAccount} onClose={handleModalClose} />}
        </div>
    )
}
