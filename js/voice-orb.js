import { Conversation } from "https://esm.sh/@elevenlabs/client@1.17.0";
import { initVoiceOrb3D } from "./voice-orb-3d.js";

const AGENT_ID = "agent_8101kyfxtn8tf3vrnt1z64nfq9z6";

const orb = document.getElementById("voice-orb");
const orbCanvas = document.getElementById("voice-orb-canvas");
const caption = document.getElementById("voice-orb-caption");
const endBtn = document.getElementById("voice-orb-end");
const heroSection = document.getElementById("colorlib-hero");

if (orb && orbCanvas && caption && endBtn && heroSection) {
	const orb3d = initVoiceOrb3D(orbCanvas);
	let conversation = null;
	let levelTimer = null;
	let connecting = false;

	function setCaption(text) {
		caption.textContent = text;
	}

	function pollLevel() {
		if (!conversation) return;
		Promise.resolve(conversation.getOutputVolume())
			.then((level) => {
				const scale = 1 + Math.min(level, 1) * 0.18;
				orb.style.setProperty("--orb-scale", scale.toFixed(3));
				orb3d.setLevel(level);
			})
			.catch(() => {});
	}

	async function startConversation() {
		if (connecting || conversation) return;
		connecting = true;
		orb.classList.add("is-connecting");
		orb3d.setState("connecting");
		setCaption("Connecting...");

		try {
			await navigator.mediaDevices.getUserMedia({ audio: true });

			conversation = await Conversation.startSession({
				agentId: AGENT_ID,
				onConnect: () => {
					orb.classList.remove("is-connecting");
					orb.classList.add("is-active");
					orb3d.setState("active");
					endBtn.hidden = false;
					setCaption("Listening...");
					levelTimer = window.setInterval(pollLevel, 100);
				},
				onDisconnect: () => {
					stopConversation();
				},
				onError: () => {
					setCaption("Something went wrong. Click to try again.");
					stopConversation();
				},
				onModeChange: ({ mode }) => {
					orb.classList.toggle("is-speaking", mode === "speaking");
					orb3d.setState(mode === "speaking" ? "speaking" : "active");
					setCaption(mode === "speaking" ? "Speaking..." : "Listening...");
				},
			});
		} catch (err) {
			connecting = false;
			orb.classList.remove("is-connecting");
			orb3d.setState("idle");
			setCaption("Mic access is needed to talk. Click to try again.");
		}
	}

	function stopConversation() {
		connecting = false;
		if (levelTimer) {
			window.clearInterval(levelTimer);
			levelTimer = null;
		}
		orb.style.removeProperty("--orb-scale");
		orb.classList.remove("is-active", "is-speaking", "is-connecting");
		orb3d.setState("idle");
		orb3d.setLevel(0);
		endBtn.hidden = true;
		setCaption("Click the orb to start talking");

		const active = conversation;
		conversation = null;
		if (active) {
			Promise.resolve(active.endSession()).catch(() => {});
		}
	}

	orb.addEventListener("click", () => {
		if (conversation || connecting) return;
		startConversation();
	});

	endBtn.addEventListener("click", stopConversation);

	// Voice agent only exists within the hero section — end the session once it scrolls out of view.
	const heroObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting && (conversation || connecting)) {
					stopConversation();
				}
			});
		},
		{ threshold: 0 }
	);
	heroObserver.observe(heroSection);
}
