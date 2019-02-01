const account = {
	username: "guest",
	password: "guest",
	logout_dup: true
};

let ptt = new PttSocket("wss://ws.ptt.cc/bbs/", bot);

function bot(data) {
	console.log(data);
	if (data.includes("請輸入代號")) {
		ptt.sendline(account.username);
		ptt.sendline(account.password);
	}

	if (data.includes("請按任意鍵繼續"))
		ptt.sendline();

	if (data.includes("您想刪除其他重複登入的連線嗎")) {
		if(account.logout_dup)
			ptt.sendline("Y");
		else
			ptt.sendline("N");
	}

	if (data.includes("【主功能表】")) {
		ptt.sendline("F")
	}

}