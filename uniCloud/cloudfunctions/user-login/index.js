'use strict';
exports.main = async (event, context) => {
	const db = uniCloud.database()
	const dbCmd = db.command
	const { code } = event
	
	if (!code) {
		return {
			success: false,
			errMsg: '缺少code参数'
		}
	}
	
	try {
		const wxResult = await uniCloud.fetchWeixinCodeSession(code)
		
		if (wxResult.errMsg) {
			return {
				success: false,
				errMsg: wxResult.errMsg
			}
		}
		
		const { openid } = wxResult
		
		const userRes = await db.collection('opendb-users').where({
			openid: openid
		}).get()
		
		let userInfo
		
		if (userRes.data && userRes.data.length > 0) {
			userInfo = userRes.data[0]
		} else {
			userInfo = {
				openid: openid,
				nickname: '学生' + Math.floor(Math.random() * 10000),
				avatar: '',
				grade: 3,
				school: '',
				exp: 0,
				level: 1,
				vip: false,
				vipExpire: '',
				learnedWords: 0,
				wrongQuestions: 0,
				streakDays: 0,
				lastStudyDate: '',
				aiCount: 0,
				aiCountDate: '',
				createDate: db.serverDate(),
				updateDate: db.serverDate()
			}
			
			await db.collection('opendb-users').add(userInfo)
			userInfo._id = userInfo._id || 'new_user'
		}
		
		const token = require('crypto').randomBytes(16).toString('hex')
		
		await uniCloud.redis().set(`token:${token}`, openid, 'EX', 7 * 24 * 60 * 60)
		
		return {
			success: true,
			token: token,
			user: {
				id: userInfo._id,
				nickname: userInfo.nickname,
				avatar: userInfo.avatar,
				grade: userInfo.grade,
				exp: userInfo.exp,
				level: userInfo.level,
				vip: userInfo.vip,
				vipExpire: userInfo.vipExpire,
				learnedWords: userInfo.learnedWords,
				wrongQuestions: userInfo.wrongQuestions,
				streakDays: userInfo.streakDays
			}
		}
		
	} catch (e) {
		return {
			success: false,
			errMsg: e.message || '登录失败'
		}
	}
}
