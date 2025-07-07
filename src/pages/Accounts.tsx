import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Cookie, Shield, CheckCircle, XCircle, AlertCircle, MoreHorizontal, Users } from 'lucide-react'
import type { AccountResponse } from '../api/types'
import { accountsApi } from '../api/client'
import { AccountModal } from '../components/AccountModal'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function Accounts() {
    const [accounts, setAccounts] = useState<AccountResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState<AccountResponse | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null)

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

    const handleDelete = async () => {
        if (!accountToDelete) return

        try {
            await accountsApi.delete(accountToDelete)
            await loadAccounts()
            setDeleteDialogOpen(false)
            setAccountToDelete(null)
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
        return authType === 'both' ? <Shield className='h-4 w-4' /> : <Cookie className='h-4 w-4' />
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
                return <CheckCircle className='h-4 w-4 text-green-500' />
            case 'invalid':
                return <XCircle className='h-4 w-4 text-red-500' />
            case 'rate_limited':
                return <AlertCircle className='h-4 w-4 text-yellow-500' />
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
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>
                
                <Card>
                    <CardContent className="p-0">
                        <div className="space-y-3 p-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-3/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">账户管理</h1>
                    <p className="text-muted-foreground">管理 Claude 账户，支持 Cookie 和 OAuth 认证方式</p>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" />
                    添加 Cookie
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {accounts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="rounded-full bg-muted p-6 mb-4">
                                <Users className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">暂无账户</h3>
                            <p className="text-muted-foreground mb-4">点击"添加 Cookie"创建第一个账户</p>
                            <Button onClick={handleAdd}>
                                <Plus className="mr-2 h-4 w-4" />
                                添加账户
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Organization UUID</TableHead>
                                    <TableHead>认证方式</TableHead>
                                    <TableHead>状态</TableHead>
                                    <TableHead>账户类型</TableHead>
                                    <TableHead>最后使用</TableHead>
                                    <TableHead>重置时间</TableHead>
                                    <TableHead className="text-right">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {accounts.map(account => (
                                    <TableRow key={account.organization_uuid}>
                                        <TableCell className="font-mono text-sm">
                                            {account.organization_uuid}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getAuthTypeIcon(account.auth_type)}
                                                <span>{getAuthTypeName(account.auth_type)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(account.status)}
                                                <span>{getStatusName(account.status)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {account.is_max ? (
                                                <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500">
                                                    Max
                                                </Badge>
                                            ) : account.is_pro ? (
                                                <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                                    Pro
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">Free</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(account.last_used).toLocaleString('zh-CN')}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {account.resets_at
                                                ? new Date(account.resets_at).toLocaleString('zh-CN')
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <span className="sr-only">打开菜单</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(account)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        编辑
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => {
                                                            setAccountToDelete(account.organization_uuid)
                                                            setDeleteDialogOpen(true)
                                                        }}
                                                        className="text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        删除
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>确定要删除这个账户吗？</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作无法撤销。删除后将永久移除该账户的所有数据。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            删除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {modalOpen && <AccountModal account={editingAccount} onClose={handleModalClose} />}
        </div>
    )
}
