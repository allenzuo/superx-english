'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database()
	const { orderId, token } = event
	
	if (!orderId || !token) {
		return {
			success: false,
			errMsg: '参数不完整'
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
		
		const orderRes = await db.collection('vip-orders').where({
			orderId: orderId,
			openid: openid
		}).get()
		
		if (!orderRes.data || orderRes.data.length === 0) {
			return {
				success: false,
				errMsg: '订单不存在'
			}
		}
		
		const order = orderRes.data[0]
		
		if (order.status === 'paid') {
			return {
				success: true,
				message: '会员已激活'
			}
		}
		
		await db.collection('vip-orders').where({
			orderId: orderId
		}).update({
			status: 'paid',
			paidDate: db.serverDate()
		})
		
		const userRes = await db.collection('opendb-users').where({
			openid: openid
		}).get()
		
		let newExpireDate
		if (userRes.data && userRes.data.length > 0) {
			const user = userRes.data[0]
			const now = new Date()
			if (user.vip && user.vipExpire) {
				const currentExpire = new Date(user.vipExpire)
				if (currentExpire > now) {
					newExpireDate = new Date(currentExpire.getTime() + order.duration * 24 * 60 * 60 * 1000)
				} else {
					newExpireDate = new Date(now.getTime() + order.duration * 24 * 60 * 60 * 1000)
				}
			} else {
				newExpireDate = new Date(now.getTime() + order.duration * 24 * 60 * 60 * 1000)
			}
			
			await db.collection('opendb-users').where({
				openid: openid
			}).update({
				vip: true,
				vipExpire: newExpireDate.toISOString().split('T')[0],
				updateDate: db.serverDate()
			})
		}
		
		return {
			success: true,
			message: '会员激活成功',
			expireDate: newExpireDate ? newExpireDate.toISOString().split('T')[0] : null
		}
		
	} catch (e) {
		return {
			success: false,
			errMsg: e.message || '激活失败'
		}
	}
}
