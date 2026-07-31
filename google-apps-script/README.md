# Google Apps Script for the Convention App

Copy the contents of `Code.gs` into your Google Apps Script project.

Deploy steps:

1. Open Google Apps Script from your Google Sheet.
2. Delete the current contents of `Code.gs`.
3. Paste in the contents of `google-apps-script/Code.gs` from this repository.
4. Replace the `ADMIN_TOKEN` value if needed so it matches the token used by the app.
5. Click **Save**.
6. Go to **Deploy → Manage deployments**.
7. Click the pencil/edit icon for the Web App deployment.
8. Select **New version**.
9. Confirm:
   - **Execute as:** Me
   - **Who has access:** Anyone
10. Click **Deploy**.

The deployed `/exec` URL should return JSON like:

```json
{"ok":true,"success":true,"message":"Convention app Google Sheet writer is running"}
```

Supported actions:

- `createEvent`
- `updateEvent`
- `createMember`
- `updateMember`
- `createNotification`
- `updateNotification`
- `getAppConfig`
- `saveAppConfig`

Sheets used:

- `Events`
- `Members`
- `Notifications`
- `AppConfig`
