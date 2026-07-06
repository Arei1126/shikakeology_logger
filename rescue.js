// ここにコピーしてもらったデータを貼り付けてね
const rawData = { /* ここにデータをペースト */ };

const data = JSON.parse(rawData.shikake_history);

data.forEach((session, index) => {
    const logs = session.logs;
    const headers = ['ID', 'Timestamp_ISO', 'Timestamp_JST', 'UnixTime', 'Gender', 'Action', 'isGroup', 'Note'];
    
    const rows = logs.map(log => [
        log.id,
        log.timestamp,
        new Date(log.unixTime).toLocaleString('ja-JP'),
        log.unixTime,
        log.gender,
        log.action,
        log.isGroup ? '1' : '0',
        `"${(log.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // ブラウザで実行する場合はダウンロードリンクを生成
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shikake_log_session_${index + 1}_${session.id.slice(0,8)}.csv`;
    link.click();
});
