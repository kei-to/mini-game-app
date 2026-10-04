# フロントエンド向け認証API

- APIバージョン: `v1`
- 更新日: 2026-10-04
- 対象: ログイン、トークン更新、ログアウト、認証確認
- 互換性: 現行APIに準拠します。将来の業務APIは本書へ追記してください。

## 接続先

| 環境 | APIベースURL |
| --- | --- |
| ローカル開発 | `http://localhost:3000` |
| 本番 | デプロイ環境のAPI URL |

以下のパスはAPIベースURLからの相対パスです。業務APIは`/api/v1`配下です。ヘルスチェック`GET /api/health`はバージョン対象外です。

### ブラウザー接続条件

- ローカルの許可Origin既定値は`http://localhost:4200`です。本番ではAPIサーバーの環境変数`AUTH_ALLOWED_ORIGINS`にフロントエンドの完全なOriginを設定してください。複数指定する場合はカンマで区切ります。パスやワイルドカードは指定せず、本番OriginにはHTTPSを使用してください。
- 許可されたOriginに対し、APIは資格情報付きCORSヘッダーを返します。許可するメソッドは`GET`、`POST`、`OPTIONS`、ヘッダーは`Authorization`、`Content-Type`です。
- ブラウザーからのログイン・更新・ログアウトでは資格情報を含めてください。Angular `HttpClient`では`withCredentials: true`、Fetchでは`credentials: "include"`を指定します。
- Refresh Cookieは`HttpOnly`、`SameSite=Strict`、`Path=/api/v1/auth`で、有効期間は30日です。本番では`Secure`も付きます。ホスト限定CookieとしてAPIのホストに保存され、JavaScriptから読み取ることはできません。
- Cookieが`SameSite=Strict`のため、フロントエンドとAPIは同一サイト内に配置してください。`localhost:4200`と`localhost:3000`はポートのみが異なるためローカル開発で利用できますが、異なるサイト間のCookie更新には対応しません。
- Cookieを使う`refresh`と`logout`では`Origin`ヘッダーが必須で、許可リスト外のOriginは拒否されます。`login`はOriginが付いている場合に照合しますが、Originを送らないネイティブクライアントは許可します。

## 認証

アクセストークンは有効期間15分のJWTです。ログインまたは更新応答の`accessToken`をアプリケーションのメモリ上に保持し、保護APIへ次のヘッダーを送信してください。

```http
Authorization: Bearer <accessToken>
```

JWTペイロードにはユーザーID（`sub`）などのクレームが含まれます。JWTは署名されていますが、暗号化はされていません。ペイロードの値をフロントエンドで認可判断に使用しないでください。パスワードやRefresh TokenをJWTやWeb Storageに保存しないでください。

### フロントエンドの認証フロー

1. ログイン成功後、アクセストークンをメモリ上に保存します。ページ再読み込み後はRefresh Cookieを使って新しいトークンを取得します。
2. 保護APIにはアクセストークンをBearerヘッダーとして付けます。
3. 更新対象の保護APIが`401 unauthorized`を返した場合に限り、`POST /api/v1/auth/refresh`を一度だけ呼び出します。成功したらアクセストークンを更新し、元のリクエストを一度だけ再送します。
4. 同時に発生した更新要求はまとめます。複数タブ間でも更新を調停してください。ローテーション済みRefresh Tokenが再利用されると、そのトークン系列に属する有効セッションも失効します。
5. 更新に失敗した場合、メモリ上のアクセストークンを消去してログイン画面へ戻します。無限に再試行しないでください。
6. ログアウトではAPIを呼び出し、成功後にメモリ上のアクセストークンを消去します。

Angularクライアントでは、これらの呼び出しを注入可能な`AuthService`から利用できます。HTTP interceptorがBearerトークンを付与し、更新と再送を一度だけ行います。`API_BASE_URL`はAngularのInjection Tokenです。既定値は空文字列で、同一オリジンの`/api/v1/...`を使用します。開発サーバーは`/api`をローカルAPIへ転送します。APIを直接呼び出すデプロイでは、`https://api.example.com`のようなOriginを`API_BASE_URL`に指定し、API側にも許可Originを設定してください。開発サーバーを4200以外のポートで使う場合は、そのフロントエンドOriginを`AUTH_ALLOWED_ORIGINS`に追加してください。

同一タブ内の更新要求は`AuthService`でまとめられます。複数タブ間の更新はブラウザーのWeb Locks APIで直列化するため、複数タブで利用する場合はWeb Locksに対応したブラウザーを使用してください。また、本番での`SameSite=Strict` Cookieにはセキュアコンテキストが必要です（HTTPS。ローカル開発ではlocalhostもセキュアとして扱われます）。

## エンドポイント

### `POST /api/v1/auth/login`

ログイン情報を検証し、アクセストークンを返すと同時にRefresh Cookieを設定します。リクエスト本文の上限は32 KBです。不正なJSONには`400 invalid_json`、上限を超える本文には`413 payload_too_large`を返します。

リクエスト:

```http
POST /api/v1/auth/login
Content-Type: application/json
Origin: http://localhost:4200
```

```json
{
  "loginId": "user@example.com",
  "password": "your-password"
}
```

`loginId`は照合前に前後の空白を除去し、1〜254文字を受け付けます。`password`は1〜1024文字を受け付けます。運用者CLIで登録するパスワードは、表示可能なASCII文字12〜128文字に制限されています。

成功時`200 OK`:

```json
{
  "accessToken": "<JWT>",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

レスポンスにはRefresh Cookieの`Set-Cookie`ヘッダーと`X-Request-Id`が含まれます。JavaScriptでCookieの値を読み取ったり保存したりしないでください。

| HTTP | 本文 | 意味 |
| --- | --- | --- |
| `400` | `{"error":"invalid_request"}` | `loginId`または`password`が不正 |
| `401` | `{"error":"invalid_credentials"}` | 認証情報が不正、またはアカウントが無効 |
| `403` | `{"error":"forbidden_origin"}` | 指定されたOriginが許可されていない |
| `429` | `{"error":"too_many_requests"}` | IP単位のログイン上限超過。既定値は15分間に10回 |
| `503` | `{"error":"authentication_busy"}` | Scrypt処理中および待ち行列が上限に到達。`Retry-After: 1`を返す |

ログイン上限は現状APIプロセス単位です。`429`を受けたらすぐに再試行しないでください。Scryptは既定で同時1件、待ち行列4件です。`503`後に再試行が必要な場合は、少なくとも1秒待ってください。

### `POST /api/v1/auth/refresh`

Refresh Cookieをローテーションし、新しいアクセストークンを返します。リクエスト本文は不要です。OriginとCookieの両方が必要です。

```http
POST /api/v1/auth/refresh
Origin: http://localhost:4200
Cookie: refresh_token=<ブラウザーが自動送信>
```

Fetchの例:

```javascript
const response = await fetch(`${apiBase}/api/v1/auth/refresh`, {
  method: "POST",
  credentials: "include"
});
```

成功時のJSONはログイン応答と同じ形式で、新しいRefresh Cookieも設定されます。古いRefresh Tokenは失効します。古いトークンを再利用すると、同じトークン系列の有効セッションも失効します。

| HTTP | 本文 | 意味 |
| --- | --- | --- |
| `401` | `{"error":"unauthorized"}` | Cookieがない、期限切れ、失効済み、または再利用を検知 |
| `403` | `{"error":"forbidden_origin"}` | Originがない、または許可されていない |

更新失敗時にループ再試行しないでください。認証状態を消去してください。

### `POST /api/v1/auth/logout`

現在のRefresh Cookieに対応するセッションを失効させ、Cookieを削除します。アクセストークンのAuthorizationヘッダーは不要ですが、Originは必須です。

```http
POST /api/v1/auth/logout
Origin: http://localhost:4200
Cookie: refresh_token=<ブラウザーが自動送信>
```

Fetchの例:

```javascript
await fetch(`${apiBase}/api/v1/auth/logout`, {
  method: "POST",
  credentials: "include"
});
```

成功時は`204 No Content`です。Cookieがすでにない場合も`204`を返します。Cookieはただちに失効しますが、発行済みアクセストークンは最大15分間有効な場合があります。成功後、メモリ上のアクセストークンを消去してください。

`403`と`{"error":"forbidden_origin"}`は、Originがないか許可されていないことを示します。

### `GET /api/v1/auth/me`

Bearerアクセストークンで保護された認証確認用エンドポイントです。

```http
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
```

成功時`200 OK`:

```json
{
  "userId": "<user-id>"
}
```

Cookieやリクエスト本文は不要です。アクセストークンがない、期限切れ、または署名が不正な場合は`401`を返します。

## 共通レスポンスとエラー

| HTTP | 本文 | フロントエンドでの扱い |
| --- | --- | --- |
| `400` | `{"error":"invalid_request"}` | 入力を修正して再送 |
| `400` | `{"error":"invalid_json"}` | JSON構文を修正 |
| `401` | `{"error":"unauthorized"}`または`{"error":"invalid_credentials"}` | 対象の保護APIに限り一度だけ更新。それ以外はログインを要求 |
| `403` | `{"error":"forbidden_origin"}` | Origin/CORS設定を確認し、自動再試行しない |
| `404` | `{"error":"not_found"}` | パスまたはAPIバージョンを確認 |
| `413` | `{"error":"payload_too_large"}` | 本文を32 KB以下にする |
| `429` | `{"error":"too_many_requests"}` | ログイン試行を抑制 |
| `503` | `{"error":"authentication_busy"}` | `Retry-After`後に、必要な場合のみ再試行 |
| `500` | `{"error":"internal_server_error","requestId":"<id>"}` | 利用者には一般的なエラーを表示し、調査用にリクエストIDを記録 |

通常のAPI応答には`X-Request-Id`が含まれます。ネットワークエラーや、定義された形式と異なるエラー本文も安全に処理してください。

## フロントエンド実装上の注意

- アクセストークンはメモリ上だけで管理し、`localStorage`や`sessionStorage`に保存しないでください。JavaScriptでRefresh Tokenを扱わないでください。
- 更新処理は対象の保護APIに限定してください。`login`、`refresh`、`logout`自体が`401`を返した場合、再帰的に更新しないでください。
- `403`はOrigin拒否として扱い、ログイン切れと混同せず、許可Origin設定やリクエスト環境を確認してください。
- `Set-Cookie`はブラウザーが管理します。JavaScriptから読み取らないでください。
- APIはSQLi形式・スクリプト形式のログインIDを応答に反映しません。ただしJSONがHTMLコンテキスト向けにエスケープされているとは限りません。フレームワーク標準のテキストバインドを使い、`innerHTML`相当のAPIを避けてください。CORS、Cookie、APIのHelmet設定はフロントエンドのXSS対策の代わりにはなりません。
- `GET /api/health`は認証不要で、`{"status":"ok","service":"api-workspace"}`を返します。