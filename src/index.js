import "babel-polyfill";
import Ptt from "./Ptt";
import dom, { Fragment } from 'jsx-render';

(async function () {
	const ptt = new Ptt();
	await ptt.connect();

	const favoriteBtn = (<a class="btn" href="#">最愛看版</a>)
	favoriteBtn.onclick = async () => {
		if (!ptt.state.login)
			await ptt.login(account);
		const boardList = document.querySelector(".b-list-container");
		boardList.innerHTML = "";
		ptt.state.login && ptt.getFavorite()
			.then(list => {
				list.forEach(board =>
					boardList.appendChild(
						<div class="b-ent">
							<a class="board" href={`/bbs/${board.boardname}/index.html`}>
								<div class="board-name">{board.boardname}</div>
								<div class="board-nuser"><span class="hl">{board.nuser}</span></div>
								<div class="board-class">{board.category}</div>
								<div class="board-title">◎{board.title}</div>
							</a>
						</div>
					)
				)
			})
	};
	document.querySelector('.btn-group-cls').appendChild(favoriteBtn);
})();

const account = {
	username: "guest",
	password: "guest",
	logout_dup: false,
	delete_try_log: true
};
