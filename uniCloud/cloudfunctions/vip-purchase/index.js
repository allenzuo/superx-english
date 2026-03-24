'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database()
	const dbCmd = db.command
	const { planId, token } = event
	
	if (!token || !planId) {
		return {
			success: false,
			errMsg: '参数不完整'
		}
	}
	
	const PLANS = {
		'monthly': { price: 1900, duration: 30, name: '月度会员' },
		'quarterly': { price: 4900, duration: 90, name: '季度会员' },
		'yearly': { price: 9900, duration: 365, name: '年度会员' }
	}
	
	const plan = PLANS[planId]
	if (!plan) {
		return {
			success: false,
			errMsg: '套餐不存在'
		}
	}
	
	try {
		const openid = await uniCloud.redis().get(`token:${token}`)
		if (!openid) {
			return {
				success: false,
				errMsg: '登录已过期'
			}
		}
		
		const orderId = 'VIP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
		
		const order = {
			orderId: orderId,
			openid: openid,
			planId: planId,
			planName: plan.name,
			amount: plan.price,
			duration: plan.duration,
			status: 'pending',
			createDate: db.serverDate()
		}
		
		await db.collection('vip-orders').add(order)
		
		const payResult = await uniCloud.invokeWeixinServerlessAPI({
			action: 'unifiedOrder',
			data: {
				body: plan.name,
				out_trade_no: orderId,
				total_fee: plan.price,
				spbill_create_ip: context.CLIENTIP,
				notify_url: 'https://your-domain.com/api/payment/notify',
				trade_type: 'JSAPI',
				openid: openid
			}
		})
		
		return {
			success: true,
			orderId: orderId,
			payment: payResult
		}
		
	} catch (e) {
		return {
			success: false,
			errMsg: e.message || '创建订单失败'
		}
	}
}
