import "babel-polyfill";
import Ptt from "./Ptt";

const account = {
	username: "guest",
	password: "guest",
	logout_dup: false
};

(async () => {
	const ptt = new Ptt();
	await ptt.connect();
	const success = await ptt.login(account);
	if (success)
		console.log(await ptt.getFavorite());
	else
		alert("QQ");
})();