import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel("Antigravity Mover");

    // 1. Construct the Source Path (Using User Home Dir)
    // Path: /Users/{User}/.gemini/antigravity/brain/
    const homeDir = os.homedir();
    const antigravityBase = path.join(homeDir, '.gemini', 'antigravity', 'brain');

    // 2. Setup the Watcher Pattern
    // The "**" means: look inside any UUID folder (7c32739...) inside brain
    const pattern = new vscode.RelativePattern(antigravityBase, '**/*.{png,jpg,jpeg}');
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    outputChannel.appendLine(`Started watching: ${antigravityBase}`);

    // 3. Define the Move Logic
    watcher.onDidCreate(async (uri) => {
        // Check if feature is enabled
        const config = vscode.workspace.getConfiguration('antigravityMover');
        if (!config.get('enable')) return;

        // Ensure we have a workspace open
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return; // Nowhere to move files to if no project is open
        }

        const projectRoot = workspaceFolders[0].uri.fsPath;
        const targetFolderName = config.get<string>('destinationFolder') || '.antigravity-images';
        const destDir = path.join(projectRoot, targetFolderName);

        // Create destination folder if it doesn't exist
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        // Get the original filename (e.g., maxi_crm_dashboard_1765702091403.png)
        const fileName = path.basename(uri.fsPath);
        const destPath = path.join(destDir, fileName);

        // Wait briefly (500ms) to ensure Antigravity finished writing the file
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            // Move file (Copy only, preserving source as requested)
            fs.copyFileSync(uri.fsPath, destPath);
            // fs.unlinkSync(uri.fsPath); // Removed to keep source file

            vscode.window.showInformationMessage(`Antigravity: Imported ${fileName}`);
            outputChannel.appendLine(`Moved: ${fileName} to ${targetFolderName}`);

        } catch (error) {
            outputChannel.appendLine(`Error moving file: ${error}`);
            console.error(error);
        }
    });

    context.subscriptions.push(watcher);
}

export function deactivate() { }