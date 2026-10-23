# Social App – Agile Project 2

**Reg No:** 24MIS0476 · **Project:** Social App

| Version | Features | Docker tag | Kubernetes URL |
|---|---|---|---|
| v1 | Add Post | `social-app:v1` | http://localhost:30001 |
| v2 | Add Post + Like | `social-app:v2` | http://localhost:30002 |
| v3 | Add Post + Like + Comment | `social-app:v3` | http://localhost:30003 |

Pipeline: **VS Code → GitHub → Jenkins → Docker → DockerHub → Kubernetes**

## Folder structure

```
SocialApp-24MIS0476/
├── v1/            Add Post
│   ├── server.js, package.json, Dockerfile, public/index.html
├── v2/            Add Post + Like
├── v3/            Add Post + Like + Comment
├── k8s/
│   ├── social-app-v1.yaml   (Deployment + Service, NodePort 30001)
│   ├── social-app-v2.yaml   (NodePort 30002)
│   └── social-app-v3.yaml   (NodePort 30003)
├── Jenkinsfile
└── README.md
```

The app uses plain Node.js with **no npm packages**, so there is nothing to `npm install`.

---

## What you need installed

- VS Code
- Git
- Node.js (only to test locally)
- Docker Desktop, with **Kubernetes enabled** (Docker Desktop → Settings → Kubernetes → Enable Kubernetes → Apply & Restart)
- Jenkins (running on `http://localhost:8080`)
- A DockerHub account and a GitHub account

Check them in a terminal:

```
git --version
node -v
docker --version
kubectl get nodes
```

`kubectl get nodes` should show `docker-desktop   Ready`.

---

## Step 1 – Open in VS Code and test locally

Open the `SocialApp-24MIS0476` folder in VS Code, then open the terminal (Ctrl + `):

```
cd v1
node server.js
```

Open http://localhost:3000, add a post, then press Ctrl + C. Repeat with `v2` and `v3`.

---

## Step 2 – Push to GitHub (one commit per version)

Create an **empty** repo on GitHub named `social-app-24MIS0476` (no README). Then in the project folder:

```
git init
git branch -M main
git add README.md Jenkinsfile .gitignore
git commit -m "Project setup: Jenkinsfile and README"

git add v1 k8s/social-app-v1.yaml
git commit -m "v1: Add Post feature"

git add v2 k8s/social-app-v2.yaml
git commit -m "v2: Like feature"

git add v3 k8s/social-app-v3.yaml
git commit -m "v3: Comment feature"

git remote add origin https://github.com/<your-github-username>/social-app-24MIS0476.git
git push -u origin main
```

Optional, if your sir wants **separate branches** too:

```
git branch v1 HEAD~2
git branch v2 HEAD~1
git branch v3
git push origin v1 v2 v3
```

Optional, if he wants **tags** on GitHub too:

```
git tag v1 HEAD~2
git tag v2 HEAD~1
git tag v3
git push origin --tags
```

---

## Step 3 – Jenkins pipeline

1. Open Jenkins → **Manage Jenkins → Plugins**. Make sure these are installed: *Pipeline*, *Git*, *Credentials Binding*.
2. **Add DockerHub credentials:** Manage Jenkins → Credentials → System → Global credentials → Add Credentials
   - Kind: **Username with password**
   - Username: your DockerHub username
   - Password: your DockerHub password (or an access token from DockerHub → Account Settings → Security)
   - ID: **`dockerhub-creds`** (it must be exactly this)
3. **New Item** → name `social-app-pipeline` → **Pipeline** → OK.
4. Under **Pipeline**:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: your GitHub repo URL
   - Branch: `*/main`
   - Script Path: `Jenkinsfile`
   - Save.
5. Click **Build Now** once. The first run only loads the parameters and may fail; that's normal.
6. Click **Build with Parameters**:
   - APP_VERSION: `all` (or v1 / v2 / v3)
   - DOCKERHUB_USER: your DockerHub username
   - Build.

The pipeline does: Checkout → Build Docker Images → Push to DockerHub → Deploy to Kubernetes.

### If Jenkins can't find docker or kubectl (common on Windows)

- Jenkins runs as a Windows service under a different user, so it can't see Docker Desktop or your Kubernetes config. Fix: open **services.msc** → **Jenkins** → Properties → **Log On** tab → "This account" → enter your Windows username and password → restart Jenkins.
- Or copy your kube config so Jenkins can read it: copy `C:\Users\<you>\.kube\config` into the Jenkins user's `.kube` folder.
- Make sure Docker Desktop is running before you build.

---

## Step 4 – Docker and DockerHub (manual commands, same as Jenkins does)

Replace `<user>` with your DockerHub username:

```
docker login

docker build -t <user>/social-app:v1 v1
docker build -t <user>/social-app:v2 v2
docker build -t <user>/social-app:v3 v3

docker push <user>/social-app:v1
docker push <user>/social-app:v2
docker push <user>/social-app:v3

docker images
```

Quick test of one container without Kubernetes:

```
docker run -d -p 8001:3000 <user>/social-app:v1
```

Then open http://localhost:8001.

On DockerHub you should see the repository **social-app** with tags **v1, v2, v3**.

---

## Step 5 – Kubernetes (3 deployments, 3 services)

First, in the three files in `k8s/`, replace `DOCKERHUB_USERNAME` with your DockerHub username (Jenkins does this automatically; do it yourself for the manual route). Then:

```
kubectl apply -f k8s/

kubectl get deployments
kubectl get pods
kubectl get services
```

You should see:

```
social-app-v1   social-app-v1-service   NodePort  3000:30001
social-app-v2   social-app-v2-service   NodePort  3000:30002
social-app-v3   social-app-v3-service   NodePort  3000:30003
```

Open:

- **v1:** http://localhost:30001 (Add Post only)
- **v2:** http://localhost:30002 (Add Post + Like)
- **v3:** http://localhost:30003 (Add Post + Like + Comment)

If localhost doesn't open (for example with Minikube instead of Docker Desktop), use port-forward:

```
kubectl port-forward service/social-app-v1-service 30001:3000
kubectl port-forward service/social-app-v2-service 30002:3000
kubectl port-forward service/social-app-v3-service 30003:3000
```

Run each one in its own terminal.

---

## Screenshots to take for submission

1. VS Code with the project open
2. GitHub repo showing the commits (and branches or tags if used)
3. Jenkins pipeline Stage View, with all stages green
4. Jenkins console output
5. `docker images` output
6. DockerHub page showing tags v1, v2, v3
7. `kubectl get deployments,pods,services` output
8. Browser on localhost:30001, 30002 and 30003, each showing its features

## Clean up

```
kubectl delete -f k8s/
```

## API reference

| Method | Endpoint | Version |
|---|---|---|
| GET | `/api/posts` | v1+ |
| POST | `/api/posts` `{author, text}` | v1+ |
| POST | `/api/posts/:id/like` | v2+ |
| POST | `/api/posts/:id/comments` `{author, text}` | v3 |
| GET | `/api/version` | all |

Data is stored in memory, so posts reset when the pod restarts.
