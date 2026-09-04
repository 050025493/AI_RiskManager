import { Bell, Database, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

import { disableNotifications, enableNotifications, getNotificationStatus } from "../services/notification";

function Settings() {
  const [threshold, setThreshold] = useState("0.50");
  const [reviewCost, setReviewCost] = useState("50");
  const [missedFraudCost, setMissedFraudCost] = useState("100");
  const [notifications, setNotifications] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState("Checking notification status...");
  const [notificationError, setNotificationError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getNotificationStatus()
      .then((status) => {
        setNotifications(status === "enabled");
        setNotificationStatus(status === "enabled" ? "Notifications are enabled on this device." : "Notifications are currently disabled.");
      })
      .catch((error) => setNotificationError(error.message));
  }, []);

  const handleNotificationChange = async (enabled) => {
    setNotificationError("");
    try {
      if (enabled) {
        await enableNotifications();
        setNotifications(true);
        setNotificationStatus("Notifications are enabled on this device.");
      } else {
        await disableNotifications();
        setNotifications(false);
        setNotificationStatus("Notifications are currently disabled.");
      }
    } catch (error) {
      setNotificationError(error.message);
    }
  };

  const saveSettings = (event) => {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  return (
    <main className="min-h-screen bg-[#0b0b0f] px-6 py-8 text-[#f4f4f5] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-300">
        <section className="mb-10 border-b-2 border-[#27272f] pb-8">
          <div className="mb-4 flex items-center gap-2"><span className="h-3 w-3 bg-[#c7ff3d]" /><p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-white">System Configuration</p></div>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">Settings</h1>
          <p className="mt-4 max-w-xl font-body text-base text-zinc-400">Configure review policy, evaluation assumptions, and operator notifications.</p>
        </section>

        <form onSubmit={saveSettings} className="space-y-7">
          <SettingsSection icon={<SlidersHorizontal size={22} />} eyebrow="Decision Control" title="Review Policy" color="text-[#22d3ee]">
            <SettingField label="Review threshold" description="Transactions at or above this score are routed for human review."><div className="flex items-center gap-4"><input type="range" min="0.1" max="0.95" step="0.05" value={threshold} onChange={(event) => setThreshold(event.target.value)} className="w-full accent-[#22d3ee]" /><output className="w-16 border-2 border-[#22d3ee] px-3 py-2 text-center font-display text-sm text-[#22d3ee]">{threshold}</output></div></SettingField>
            <SettingField label="Operating mode" description="The application routes risk signals for analyst review; it does not automatically block transactions."><span className="inline-flex items-center gap-2 border-2 border-[#c7ff3d] px-4 py-3 font-body text-sm font-bold text-[#c7ff3d]"><ShieldCheck size={18} /> Human review only</span></SettingField>
          </SettingsSection>

          <SettingsSection icon={<Database size={22} />} eyebrow="Evaluation Assumptions" title="Financial Model" color="text-[#facc15]">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2"><SettingField label="Review cost per case" description="Used by threshold financial impact calculations."><CurrencyInput value={reviewCost} onChange={setReviewCost} /></SettingField><SettingField label="Missed-fraud cost per case" description="Used to estimate the cost of false negatives."><CurrencyInput value={missedFraudCost} onChange={setMissedFraudCost} /></SettingField></div>
            <p className="border-l-2 border-[#facc15] pl-4 font-body text-sm text-zinc-500">These assumptions affect evaluation-set estimates only. They are not live financial totals.</p>
          </SettingsSection>

          <SettingsSection icon={<Bell size={22} />} eyebrow="Operator Experience" title="Notifications" color="text-[#d946ef]">
            <label className="flex cursor-pointer items-center justify-between gap-6 border-2 border-[#27272f] bg-[#0f0f14] p-5"><span><span className="block font-body text-base font-bold">Alert notifications</span><span className="mt-1 block font-body text-sm text-zinc-500">Show notification status when new review alerts arrive.</span><span className={`mt-2 block font-body text-sm ${notificationError ? "text-[#ff4d4d]" : "text-[#d946ef]"}`}>{notificationError || notificationStatus}</span></span><input type="checkbox" checked={notifications} onChange={(event) => handleNotificationChange(event.target.checked)} className="h-5 w-5 accent-[#d946ef]" /></label>
          </SettingsSection>

          <div className="flex flex-wrap items-center gap-4 border-t-2 border-[#27272f] pt-7"><button type="submit" className="flex items-center gap-2 border-2 border-black bg-[#c7ff3d] px-5 py-3 font-body text-sm font-bold text-black shadow-[4px_4px_0px_#ffffff] transition hover:-translate-x-0.5 hover:-translate-y-0.5"><Save size={18} /> Save Settings</button>{saved && <span className="font-body text-sm font-bold text-[#c7ff3d]">Settings saved for this session.</span>}</div>
        </form>
      </div>
    </main>
  );
}

function SettingsSection({ icon, eyebrow, title, color, children }) {
  return <section className="border-2 border-[#27272f] bg-[#15151c] p-7 shadow-[6px_6px_0px_#27272f]"><div className="mb-7 flex items-center gap-3 border-b-2 border-[#27272f] pb-6"><div className={color}>{icon}</div><div><p className={`font-body text-xs font-bold uppercase tracking-widest ${color}`}>{eyebrow}</p><h2 className="font-display mt-2 text-2xl">{title}</h2></div></div><div className="space-y-6">{children}</div></section>;
}

function SettingField({ label, description, children }) {
  return <div><p className="font-body text-base font-bold">{label}</p><p className="mt-1 mb-3 font-body text-sm text-zinc-500">{description}</p>{children}</div>;
}

function CurrencyInput({ value, onChange }) {
  return <label className="flex items-center border-2 border-[#27272f] bg-[#0f0f14] px-4 py-3 font-body text-base"><span className="mr-3 text-[#c7ff3d]">₹</span><input type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent text-white outline-none" /></label>;
}

export default Settings;
