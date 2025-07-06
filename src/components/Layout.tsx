import { Link, Outlet, useLocation } from 'react-router-dom'
import { Settings, Users, Home, LogOut } from 'lucide-react'
import './Layout.css'

export function Layout() {
    const location = useLocation()

    const navigation = [
        { name: '仪表板', href: '/', icon: Home },
        { name: '账户管理', href: '/accounts', icon: Users },
        { name: '应用设置', href: '/settings', icon: Settings },
    ]

    const handleLogout = () => {
        localStorage.removeItem('adminKey')
        window.location.href = '/login'
    }

    return (
        <div className='layout-container'>
            {/* 侧边栏 */}
            <div className='sidebar'>
                <div className='sidebar-content'>
                    {/* Logo */}
                    <div className='logo-section'>
                        <h1 className='logo-text'>Clove</h1>
                    </div>

                    {/* 导航菜单 */}
                    <nav className='navigation'>
                        {navigation.map(item => {
                            const isActive = location.pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`nav-link ${isActive ? 'active' : ''}`}
                                >
                                    <item.icon className={`nav-icon ${isActive ? 'active' : ''}`} />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* 退出登录 */}
                    <div className='logout-section'>
                        <button
                            onClick={handleLogout}
                            className='logout-button'
                        >
                            <LogOut className='logout-icon' />
                            退出登录
                        </button>
                    </div>
                </div>
            </div>

            {/* 主内容区 */}
            <div className='main-wrapper'>
                <main className='main-content'>
                    <div className='content-container'>
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    )
}
