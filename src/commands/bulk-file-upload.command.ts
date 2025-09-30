import { FileUploadRequest } from "../models/bulk-upload.model";
import { BaseCommand } from "./base-command";
import * as vscode from 'vscode';

export class BulkFileUploadCommand extends BaseCommand {
  async callback(uri: vscode.Uri) {
    const panel = vscode.window.createWebviewPanel(
      'sftpFsBulkFileUpload',
      'Bulk File Upload',
      vscode.ViewColumn.One,
      {
        enableScripts: true, // Allow JavaScript in the webview
        retainContextWhenHidden: true
      }
    );
    
    const bootstrapMinJs = vscode.Uri.joinPath(this.extension.context.extensionUri, 'webview', 'bootstrap.bundle.min.js');
    const bootstrapMinCss = vscode.Uri.joinPath(this.extension.context.extensionUri, 'webview', 'bootstrap.min.css');
    
    const bootstrapMinJsUri = panel.webview.asWebviewUri(bootstrapMinJs);
    const bootstrapMinCssUri = panel.webview.asWebviewUri(bootstrapMinCss);
    panel.webview.html = this.getWebviewContent(uri, bootstrapMinJsUri, bootstrapMinCssUri);
    
    let files: FileUploadRequest[] = [];
    let previousTask: NodeJS.Timeout | undefined = undefined;
    let previousTaskTime = 0;
    
    const refreshList = () => {
      clearTimeout(previousTask);
      
      const doAction = () => {
        const filesWithoutContent = files.map((f) => {
          return {
            ...f,
            content: ''
          } as FileUploadRequest;
        }).sort((a, b) => a.name.localeCompare(b.name));
        panel.webview.postMessage({
          command: 'displayFiles',
          files: filesWithoutContent
        });
      };
      
      if (Date.now() - previousTaskTime > 100) {
        doAction();
        previousTaskTime = Date.now();
      } else {
        previousTask = setTimeout(() => {
          doAction();
        }, 150);
      }
    };
    
    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'uploadList':
          const res = await vscode.window.showInformationMessage(
            files.length + ' files will be uploaded to ' + uri.path + ', do you want to proceed?',
            {
              modal: true
            },
            'Yes',
            'No'
          );
          if (res === undefined || res === 'No') {
            return;
          }
          
          panel.webview.postMessage({
            command: 'uploadInProgress'
          });
          
          // Perform upload.
          try {
            // Clear list and send to web view.
            files = [];
            refreshList();
            
            panel.webview.postMessage({
              command: 'uploadEnd'
            });
          } catch(ex: any) {
            vscode.window.showErrorMessage(ex.message);
            this.extension.logger.appendErrorToMessages('sftpfs.bulkFileUpload', 'Error to bulk upload...', ex);
            
            panel.webview.postMessage({
              command: 'uploadEnd'
            });
          }
          break;
          case 'cancelList':
          files = [];
          refreshList();
          vscode.window.showInformationMessage('File list cleared.');
          break;
          case 'fileDropped':
          const file = message.file as FileUploadRequest;
          
          files = files.filter((f) => {
            return f.name.toLowerCase() !== file.name.toLowerCase();
          });
          files.push(file);
          
          refreshList();
          break;
          case 'showInfoMessage':
          vscode.window.showInformationMessage(message.content);
          break;
          case 'showWarningMessage':
          vscode.window.showWarningMessage(message.content);
          break;
          case 'showErrorMessage':
          vscode.window.showErrorMessage(message.content);
          break;
        }
      },
      undefined,
      this.extension.context.subscriptions
    );
  }
  
  private getWebviewContent(uri: vscode.Uri, bootstrapJs: vscode.Uri, bootstrapCss: vscode.Uri) {
    return `
    <!DOCTYPE html>
    <html lang="en" data-bs-theme="dark">
			<head>
				<meta charset="UTF-8">
				<link href="${bootstrapCss}" rel="stylesheet">
				<style>
					body, html { 
						width: 100vw; height: 100vh; 
					}
					body {
						display: flex; 
						justify-content: center;
					}
					.drop-zone {
						margin-top: 20px;
						height: 200px;
						min-height: 200px;
						border: 2px dashed #888;
						display: flex;
						justify-content: center;
						align-items: center;
						color: #888;
						font-size: 1.2em;
					}
					.drop-zone.drag-over {
						border-color: #4CAF50;
						color: #4CAF50;
					}
		
					.main-box {
						margin-top: 50px;
						display: flex;
						flex-direction: column;
						width: 80%;
					}
				</style>
			</head>
			<body>
		
				<div class="main-box" id="mainBox">
					<div>
						Drag files here to upload to the remote folder <b>${uri.path}</b>.
					</div>
		
					<div class="drop-zone" id="dropZone">Drag files here</div>
		
					<hr>
		
					<div class="file-list mt-3">
						<h5 class="mb-1 d-flex justify-content-between">
							<div><span id="file-list-count">0</span> Files Selected</div>
							<div><span class="btn btn-primary" onClick="upload()">Upload files</span> <span class="btn btn-danger ms-2" onClick="cancel()">Cancel</span></div>
						</h5>
		
						<table style="margin-top: 30px;" class="table table-striped">
							<thead class="bg-primary">
								<tr class="bg-primary">
									<td class="bg-primary">File Name</td>
									<td class="bg-primary">Size</td>
									<td class="bg-primary">Type</td>
									<td class="bg-primary">Actions</td>
								</tr>
							</thead>
							<tbody id="file-list">
								<tr>
									<td colspan="4" class="text-center">No files selected.</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
				
				<script src="${bootstrapJs}"></script>
				<script>
					function cancel() {
						vscode.postMessage({ 
							command: 'cancelList'
						});
					}
		
					function upload() {
						vscode.postMessage({ 
							command: 'uploadList'
						});
					}
		
					const vscode = acquireVsCodeApi();
		
					const mainBox = document.getElementById('mainBox');
					const dropZone = document.getElementById('dropZone');
		
					// Add drag and drop event listeners
					mainBox.addEventListener('dragover', (event) => {
						event.preventDefault();
						dropZone.classList.add('drag-over');
					});
		
					mainBox.addEventListener('dragleave', () => {
						dropZone.classList.remove('drag-over');
					});
		
					mainBox.addEventListener('drop', (event) => {
						event.preventDefault();
						dropZone.classList.remove('drag-over');
		
						const filesArray = Array.from(event.dataTransfer.files);
						if (filesArray.length > 1000) {
							vscode.postMessage({ 
								command: 'showWarningMessage', 
								content: 'Please do not add more than 1000 files at same time.'
							});
							return;
						}
						const currentAmount = parseInt(document.getElementById('file-list-count').innerText);
						if ((currentAmount + filesArray.length) > 1000) {
							vscode.postMessage({ 
								command: 'showWarningMessage', 
								content: 'You cannot select more than 1000 files, there are ' + (1000 - currentAmount) + ' remaining files to select and you have tried to select ' + filesArray.length + ' files.'
							});
							return;
						}
						const files = filesArray.map(file => {
							if (file.size > 100 * 1024 * 1024) {
								vscode.postMessage({ 
									command: 'showWarningMessage', 
									content: 'Size of ' + file.name + ' file is too long, maximum allowed is 100 MB.'
								});
								return;
							};
		
							const reader = new FileReader();
							
							reader.onload = () => {
								const fileContent = reader.result; // This will contain the content of the file
								
								vscode.postMessage({ 
									command: 'fileDropped', 
									file: {
										name: file.name,
										size: file.size,
										type: file.type,
										content: fileContent // File content here
									}
								});
							};
							
							reader.onerror = (error) => {
								vscode.postMessage({ 
									command: 'showWarningMessage', 
									content: 'Failed to read ' + file.name + ' file, upload of directories are not supported yet using this method.'
								});
								console.error('Error reading file:', error);
							};
		
							// Read the file content as text (you can also use readAsDataURL for binary files)
							reader.readAsDataURL(file);
						});
					});
		
					// Handle messages from the extension
					window.addEventListener('message', (event) => {
						const message = event.data;
						switch (message.command) {
							case 'displayFiles':
								if (message.files.length == 0) {
									document.getElementById('file-list-count').innerText = '0';
									document.getElementById('file-list').innerHTML = '<tr><td colspan="4" class="text-center">No files selected.</td></tr>';
									return;
								}
		
								document.getElementById('file-list-count').innerText = '' + message.files.length;
								let finalHTML = '';
								for (const file of message.files) {
									finalHTML = finalHTML + '<tr><td>' + file.name + '</td><td>' + file.size + '</td><td>' + file.type + '</td><td><span class="btn btn-sm btn-danger">Delete</span></td></tr>';
								}
								
								const fileListDOM = document.getElementById('file-list');
								fileListDOM.innerHTML = finalHTML;
								break;
						}
					});
				</script>
			</body>
    </html>
		`;
  }
}