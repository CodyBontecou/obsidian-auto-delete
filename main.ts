import {
	App,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	TFolder,
} from "obsidian";

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

interface AutoDeleteSettings {
	targetFolder: string;
	expiryDays: number;
	permanentDelete: boolean;
}

const DEFAULT_SETTINGS: AutoDeleteSettings = {
	targetFolder: "",
	expiryDays: 30,
	permanentDelete: false,
};

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export default class AutoDeletePlugin extends Plugin {
	settings: AutoDeleteSettings = DEFAULT_SETTINGS;
	private statusBarEl: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();

		// Status-bar item — shows count of notes expiring within 3 days
		this.statusBarEl = this.addStatusBarItem();
		this.updateStatusBar();

		// Ribbon icon for manual cleanup
		this.addRibbonIcon("trash", "Delete expired notes now", async () => {
			await this.deleteExpiredNotes();
		});

		// Command palette entry
		this.addCommand({
			id: "delete-expired-notes",
			name: "Delete expired notes now",
			callback: async () => {
				await this.deleteExpiredNotes();
			},
		});

		// Settings tab
		this.addSettingTab(new AutoDeleteSettingTab(this.app, this));

		// Run cleanup when layout is ready
		this.app.workspace.onLayoutReady(async () => {
			await this.deleteExpiredNotes();
		});
	}

	onunload() {}

	// -----------------------------------------------------------------------
	// Settings persistence
	// -----------------------------------------------------------------------

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// -----------------------------------------------------------------------
	// Core helpers
	// -----------------------------------------------------------------------

	/**
	 * Collect all markdown files inside the configured target folder.
	 */
	private getTargetFiles(): TFile[] {
		const { targetFolder } = this.settings;
		if (!targetFolder) return [];

		const folder = this.app.vault.getAbstractFileByPath(targetFolder);
		if (!folder || !(folder instanceof TFolder)) return [];

		const files: TFile[] = [];
		const recurse = (f: TFolder) => {
			for (const child of f.children) {
				if (child instanceof TFile && child.extension === "md") {
					files.push(child);
				} else if (child instanceof TFolder) {
					recurse(child);
				}
			}
		};
		recurse(folder);
		return files;
	}

	/**
	 * Returns true when a file's creation time is older than the expiry
	 * threshold (now − expiryDays).
	 */
	private isExpired(file: TFile): boolean {
		const thresholdMs = Date.now() - this.settings.expiryDays * 86_400_000;
		return file.stat.ctime < thresholdMs;
	}

	/**
	 * Returns true when a file will expire within the next `days` days.
	 */
	private expiresSoon(file: TFile, days: number): boolean {
		const thresholdMs = Date.now() - (this.settings.expiryDays - days) * 86_400_000;
		return file.stat.ctime < thresholdMs;
	}

	// -----------------------------------------------------------------------
	// Actions
	// -----------------------------------------------------------------------

	/**
	 * Scan the target folder and delete every expired note.
	 */
	async deleteExpiredNotes() {
		const files = this.getTargetFiles();
		const expired = files.filter((f) => this.isExpired(f));

		for (const file of expired) {
			// trash(file, permanent) – second arg = true → permanent delete
			await this.app.vault.trash(file, this.settings.permanentDelete);
		}

		if (expired.length > 0) {
			new Notice(
				`Auto-Delete: removed ${expired.length} expired note${expired.length === 1 ? "" : "s"}.`
			);
		}

		this.updateStatusBar();
	}

	/**
	 * Refresh the status-bar text with the count of notes expiring within
	 * the next 3 days.
	 */
	updateStatusBar() {
		if (!this.statusBarEl) return;

		const files = this.getTargetFiles();
		const soonCount = files.filter(
			(f) => this.expiresSoon(f, 3) && !this.isExpired(f)
		).length;

		if (soonCount > 0) {
			this.statusBarEl.setText(
				`🗑 ${soonCount} note${soonCount === 1 ? "" : "s"} expiring soon`
			);
		} else {
			this.statusBarEl.setText("");
		}
	}
}

// ---------------------------------------------------------------------------
// Settings Tab
// ---------------------------------------------------------------------------

class AutoDeleteSettingTab extends PluginSettingTab {
	plugin: AutoDeletePlugin;

	constructor(app: App, plugin: AutoDeletePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Timed Auto-Delete Notes" });

		new Setting(containerEl)
			.setName("Target folder")
			.setDesc(
				"Vault-relative path of the folder to monitor (e.g. 'Inbox/Scratch')."
			)
			.addText((text) =>
				text
					.setPlaceholder("folder/subfolder")
					.setValue(this.plugin.settings.targetFolder)
					.onChange(async (value) => {
						this.plugin.settings.targetFolder = value.trim();
						await this.plugin.saveSettings();
						this.plugin.updateStatusBar();
					})
			);

		new Setting(containerEl)
			.setName("Expiry duration (days)")
			.setDesc(
				"Notes whose creation date is older than this many days will be deleted."
			)
			.addText((text) =>
				text
					.setPlaceholder("30")
					.setValue(String(this.plugin.settings.expiryDays))
					.onChange(async (value) => {
						const parsed = parseInt(value, 10);
						if (!isNaN(parsed) && parsed > 0) {
							this.plugin.settings.expiryDays = parsed;
							await this.plugin.saveSettings();
							this.plugin.updateStatusBar();
						}
					})
			);

		new Setting(containerEl)
			.setName("Permanent delete")
			.setDesc(
				"When enabled, notes are permanently deleted instead of moved to the system trash."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.permanentDelete)
					.onChange(async (value) => {
						this.plugin.settings.permanentDelete = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
