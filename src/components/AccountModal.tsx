import { useState, useEffect } from 'react'
import { X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { AccountResponse, AccountCreate, AccountUpdate } from '../api/types'
import { accountsApi } from '../api/client'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
    const [accountType, setAccountType] = useState<'none' | 'Normal' | 'Pro' | 'Max'>('none')
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
                setAccountType('none')
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
            case 'none':
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
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className='sm:max-w-[600px]'>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{account ? '编辑账户' : '添加 Cookie'}</DialogTitle>
                        <DialogDescription>{account ? '更新账户的认证信息' : '添加新的 Claude 账户 Cookie'}</DialogDescription>
                    </DialogHeader>

                    <div className='grid gap-4 py-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='cookie_value'>
                                Cookie <span className='text-destructive'>*</span>
                            </Label>
                            <Textarea
                                id='cookie_value'
                                placeholder='粘贴您的 Claude Cookie...'
                                value={formData.cookie_value}
                                onChange={e => setFormData({ ...formData, cookie_value: e.target.value })}
                                className='min-h-[100px] font-mono text-sm'
                                required
                            />
                        </div>

                        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                            <CollapsibleTrigger asChild>
                                <Button variant='outline' type='button' className='w-full justify-between'>
                                    <span>高级选项</span>
                                    {showAdvanced ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
                                </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className='space-y-4 mt-4'>
                                {!account && (
                                    <div className='space-y-2'>
                                        <Label htmlFor='organization_uuid'>Organization UUID</Label>
                                        <Input
                                            id='organization_uuid'
                                            placeholder='留空自动获取'
                                            value={formData.organization_uuid}
                                            onChange={e => setFormData({ ...formData, organization_uuid: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className='space-y-2'>
                                    <Label htmlFor='accountType'>账户类型</Label>
                                    <Select value={accountType} onValueChange={value => setAccountType(value as any)}>
                                        <SelectTrigger id='accountType'>
                                            <SelectValue placeholder='选择账户类型' />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='none'>未选择</SelectItem>
                                            <SelectItem value='Normal'>普通</SelectItem>
                                            <SelectItem value='Pro'>Pro</SelectItem>
                                            <SelectItem value='Max'>Max</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>

                        {error && (
                            <Alert variant='destructive'>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type='button' variant='outline' onClick={onClose}>
                            取消
                        </Button>
                        <Button type='submit' disabled={loading || !formData.cookie_value.trim()}>
                            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            {loading ? '保存中...' : '保存'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
