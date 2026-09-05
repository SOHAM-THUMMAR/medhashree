import React from 'react';

/**
 * Alert Settings Form Component
 */
export default function AlertSettingsForm({
  alertConfig,
  setAlertConfig,
  handleSaveAlertConfig,
  alertConfigSaving,
  alertConfigMsg,
  handleSendTestEmail,
  testingEmail,
  testEmailMsg
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            📧 Owner Email Alerts & High-Traffic Notifications
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Receive automatic email alerts when online traffic reaches custom milestones (e.g. 100 people online right now).
          </p>
        </div>
        <button
          type="button"
          onClick={handleSendTestEmail}
          disabled={testingEmail}
          className="mt-3 md:mt-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-xs transition disabled:opacity-50"
        >
          {testingEmail ? 'Sending Test...' : '🧪 Send Test Email Alert'}
        </button>
      </div>

      {testEmailMsg && (
        <div className="mb-4 p-3 rounded-xl bg-slate-800 text-xs font-medium border border-slate-700">
          {testEmailMsg}
        </div>
      )}

      <form onSubmit={handleSaveAlertConfig} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Online User Alert Threshold
          </label>
          <input
            type="number"
            min="1"
            max="100000"
            value={alertConfig.threshold}
            onChange={(e) => setAlertConfig({ ...alertConfig, threshold: parseInt(e.target.value) || 100 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            placeholder="e.g. 100"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Owner Notification Email
          </label>
          <input
            type="email"
            value={alertConfig.recipientEmail}
            onChange={(e) => setAlertConfig({ ...alertConfig, recipientEmail: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            placeholder="owner@example.com"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Alert Cooldown (Minutes)
          </label>
          <input
            type="number"
            min="5"
            max="1440"
            value={alertConfig.cooldownMin}
            onChange={(e) => setAlertConfig({ ...alertConfig, cooldownMin: parseInt(e.target.value) || 60 })}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            placeholder="60"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
            <input
              type="checkbox"
              checked={alertConfig.enabled}
              onChange={(e) => setAlertConfig({ ...alertConfig, enabled: e.target.checked })}
              className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
            />
            Enable Alerts
          </label>

          <button
            type="submit"
            disabled={alertConfigSaving}
            className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs transition disabled:opacity-50"
          >
            {alertConfigSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {alertConfigMsg && (
        <p className="text-xs text-indigo-400 mt-3 font-medium">{alertConfigMsg}</p>
      )}
    </div>
  );
}
