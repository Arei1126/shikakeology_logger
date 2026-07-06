
const downloadCSV = (targetLogs: LogEntry[], targetInfo: SessionInfo, prefix: string) => {
	const generateCSVContent = () => {
		const headers = [
			'ID', 'Timestamp_ISO', 'Timestamp_JST', 'UnixTime', 
			'Gender', 'Action_Raw', 'isGroup', 
			'isMale', 'isFemale', 'isGroup_Dummy', 
			'Passing(0)', 'Look(1)', 'Stop(2)', 'Use(3)',
			'Note'
		];
		
		const rows = targetLogs.map(log => {
			const jstDate = new Date(log.unixTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
			return [
				log.id,
				log.timestamp,
				jstDate, 
				log.unixTime,
				log.gender,
				log.action,
				log.isGroup ? 'Group' : 'Individual',
				log.gender === 'Male' ? '1' : '0',
				log.gender === 'Female' ? '1' : '0',
				log.isGroup ? '1' : '0',
				log.isPass ? '1' : '0',
				log.isLook ? '1' : '0',
				log.isStop ? '1' : '0',
				log.isUse ? '1' : '0',
				`"${(log.note || '').replace(/"/g, '""')}"`
			];
		});

		const startTimeStr = targetInfo.startTime ? new Date(targetInfo.startTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';
		const endTimeStr = targetInfo.endTime ? new Date(targetInfo.endTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';
		const sanitizedNote = (targetInfo.note || '').replace(/[\n\r,]/g, ' ');

		return [
			`# Shikakeology Data Export (v5.16 High Contrast)`,
			`# Export Date,${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
			`# Session Start,${startTimeStr}`,
			`# Session End,${endTimeStr}`,
			`# Location,${targetInfo.location}`,
			`# Note,${sanitizedNote}`,
			`# Total Records,${targetLogs.length}`,
			headers.join(','),
			...rows.map(r => r.join(','))
		].join('\n');
	};



	const downloadCSVInternal = (targetLogs: LogEntry[], targetInfo: SessionInfo, prefix: string) => {
		const headers = [
			'ID', 'Timestamp_ISO', 'Timestamp_JST', 'UnixTime', 
			'Gender', 'Action_Raw', 'isGroup', 
			'isMale', 'isFemale', 'isGroup_Dummy', 
			'Passing(0)', 'Look(1)', 'Stop(2)', 'Use(3)',
			'Note'
		];
		const rows = targetLogs.map(log => {
			const jstDate = new Date(log.unixTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
			return [
				log.id,
				log.timestamp,
				jstDate, 
				log.unixTime,
				log.gender,
				log.action,
				log.isGroup ? 'Group' : 'Individual',
				log.gender === 'Male' ? '1' : '0',
				log.gender === 'Female' ? '1' : '0',
				log.isGroup ? '1' : '0',
				log.isPass ? '1' : '0',
				log.isLook ? '1' : '0',
				log.isStop ? '1' : '0',
				log.isUse ? '1' : '0',
				`"${(log.note || '').replace(/"/g, '""')}"`
			];
		});

		const startTimeStr = targetInfo.startTime ? new Date(targetInfo.startTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';
		const endTimeStr = targetInfo.endTime ? new Date(targetInfo.endTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '';
		const sanitizedNote = (targetInfo.note || '').replace(/[\n\r,]/g, ' ');


		const csvContent = [
			`# Shikakeology Data Export (v5.16 High Contrast)`,
			`# Export Date,${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
			`# Session Start,${startTimeStr}`,
			`# Session End,${endTimeStr}`,
			`# Location,${targetInfo.location}`,
			`# Note,${sanitizedNote}`,
			`# Total Records,${targetLogs.length}`,
		headers.join(','), ...rows.map(r => r.join(','))].join('\n');
		const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `${prefix}_${sanitizeFIleName(log.startTimeStr)}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};
