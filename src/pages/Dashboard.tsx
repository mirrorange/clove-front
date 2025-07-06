import { useEffect, useState } from 'react'
import { Users, Settings, Activity, Server } from 'lucide-react'
import { accountsApi, healthApi, statisticsApi } from '../api/client'
import type { StatisticsResponse } from '../api/types'
import './Dashboard.css'

export function Dashboard() {
    const [statistics, setStatistics] = useState<StatisticsResponse | null>(null)
    const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('offline')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            try {
                const [statsRes, healthRes] = await Promise.all([statisticsApi.get(), healthApi.check()])

                setStatistics(statsRes.data)
                setServerStatus(healthRes.status === 200 ? 'online' : 'offline')
            } catch (error) {
                console.error('Failed to load dashboard data:', error)
                setServerStatus('offline')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    const stats = [
        {
            name: '账户总数',
            value: serverStatus === 'offline' ? 'N/A' : (statistics?.accounts.total_accounts ?? 0).toString(),
            icon: Users,
            color: 'bg-pink-500',
        },
        {
            name: '服务器状态',
            value: serverStatus === 'online' ? '在线' : '离线',
            icon: Server,
            color: serverStatus === 'online' ? 'bg-green-500' : 'bg-red-500',
        },
        {
            name: '活跃会话',
            value: serverStatus === 'offline' ? 'N/A' : (statistics?.accounts.active_sessions ?? 0).toString(),
            icon: Activity,
            color: 'bg-blue-500',
        },
        {
            name: '系统状态',
            value: serverStatus === 'offline' ? 'N/A' : statistics?.status === 'healthy' ? '健康' : '降级',
            icon: Settings,
            color: statistics?.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500',
        },
    ]

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
            <div className='dashboard-header'>
                <div className='dashboard-header-content'>
                    <h2 className='dashboard-title'>仪表板</h2>
                </div>
            </div>

            <div className='section-wrapper'>
                <h3 className='section-title'>概览</h3>
                <dl className='stats-grid'>
                    {stats.map(item => (
                        <div
                            key={item.name}
                            className='stat-card'
                        >
                            <dt>
                                <div className={`stat-icon-wrapper ${item.color}`}>
                                    <item.icon className='stat-icon' aria-hidden='true' />
                                </div>
                                <p className='stat-label'>{item.name}</p>
                            </dt>
                            <dd className='stat-value-wrapper'>
                                <p className='stat-value'>{item.value}</p>
                            </dd>
                        </div>
                    ))}
                </dl>
            </div>

            <div className='quick-actions-section'>
                <h3 className='quick-actions-title'>快速操作</h3>
                <div className='quick-actions-grid'>
                    <a
                        href='/accounts'
                        className='action-card'
                    >
                        <div className='action-icon-wrapper'>
                            <Users className='action-icon' />
                        </div>
                        <div className='action-content'>
                            <span className='action-link-overlay' aria-hidden='true' />
                            <p className='action-title'>管理账户</p>
                            <p className='action-description'>添加、编辑或删除 Claude 账户</p>
                        </div>
                    </a>

                    <a
                        href='/settings'
                        className='action-card'
                    >
                        <div className='action-icon-wrapper'>
                            <Settings className='action-icon' />
                        </div>
                        <div className='action-content'>
                            <span className='action-link-overlay' aria-hidden='true' />
                            <p className='action-title'>系统设置</p>
                            <p className='action-description'>配置应用程序参数</p>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    )
}
