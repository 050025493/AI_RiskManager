import { fetchApi } from "../api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const PUSH_SUBSCRIPTION_URL = import.meta.env.VITE_PUSH_SUBSCRIPTION_URL || "/push-subscriptions";
const SERVICE_WORKER_URL = "/sw.js";

function assertBrowserSupport() {
	if (typeof window === "undefined" || typeof navigator === "undefined") {
		throw new Error("Notifications are only available in a browser.");
	}

	if (!("Notification" in window)) {
		throw new Error("This browser does not support notifications.");
	}

	if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
		throw new Error("This browser does not support push notifications.");
	}
}

function urlBase64ToUint8Array(value) {
	const normalizedValue = value.replace(/\s/g, "");
	const padding = "=".repeat((4 - (normalizedValue.length % 4)) % 4);
	const base64 = (normalizedValue + padding)
		.replace(/-/g, "+")
		.replace(/_/g, "/");

	try {
		const rawData = window.atob(base64);
		return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
	} catch {
		throw new Error("VITE_VAPID_PUBLIC_KEY is not valid Base64 URL-safe data.");
	}
}

async function syncSubscription(subscription) {
	if (!PUSH_SUBSCRIPTION_URL) {
		return;
	}

	await fetchApi(PUSH_SUBSCRIPTION_URL, {
		method: "POST",
		body: JSON.stringify({ subscription: subscription.toJSON() }),
	});
}

async function removeSubscriptionFromBackend(subscription) {
	if (!PUSH_SUBSCRIPTION_URL) {
		return;
	}

	await fetchApi(PUSH_SUBSCRIPTION_URL, {
		method: "DELETE",
		body: JSON.stringify({ endpoint: subscription.endpoint }),
	});
}

export async function requestNotificationPermission() {
	assertBrowserSupport();

	if (Notification.permission === "granted") {
		return true;
	}

	if (Notification.permission === "denied") {
		throw new Error("Notification permission is blocked in browser settings.");
	}

	const permission = await Notification.requestPermission();

	if (permission !== "granted") {
		throw new Error("Notification permission was not granted.");
	}

	return true;
}

export async function registerNotificationServiceWorker() {
	assertBrowserSupport();

	await navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: "/" });
	return navigator.serviceWorker.ready;
}

export async function subscribeToPushNotifications() {
	assertBrowserSupport();

	if (!VAPID_PUBLIC_KEY) {
		throw new Error("VITE_VAPID_PUBLIC_KEY is not configured.");
	}

	if (Notification.permission !== "granted") {
		throw new Error("Notification permission must be granted before subscribing.");
	}

	const registration = await registerNotificationServiceWorker();
	const existingSubscription = await registration.pushManager.getSubscription();

	if (existingSubscription) {
		await syncSubscription(existingSubscription);
		return existingSubscription;
	}

	const subscription = await registration.pushManager.subscribe({
		userVisibleOnly: true,
		applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
	});

	try {
		await syncSubscription(subscription);
	} catch (error) {
		await subscription.unsubscribe();
		throw error;
	}

	return subscription;
}

export async function enableNotifications() {
	await requestNotificationPermission();
	return subscribeToPushNotifications();
}

export async function disableNotifications() {
	if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
		return false;
	}

	const registration = await navigator.serviceWorker.getRegistration("/");

	if (!registration) {
		return false;
	}

	const subscription = await registration.pushManager.getSubscription();

	if (!subscription) {
		return true;
	}

	await removeSubscriptionFromBackend(subscription);
	return subscription.unsubscribe();
}

export async function getNotificationStatus() {
	if (typeof window === "undefined" || !("Notification" in window)) {
		return "unsupported";
	}

	if (Notification.permission === "denied") {
		return "denied";
	}

	if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
		return "unsupported";
	}

	if (Notification.permission === "default") {
		return "default";
	}

	const registration = await navigator.serviceWorker.getRegistration("/");

	if (!registration) {
		return "disabled";
	}

	const subscription = await registration.pushManager.getSubscription();
	return subscription ? "enabled" : "disabled";
}
