from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["Decoy"])


@router.get("/decoy")
def decoy_page():

    html = """
<!DOCTYPE html>
<html>
<head>

<title>Tech Insights Blog</title>

<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<style>

body{
font-family:Arial, Helvetica, sans-serif;
margin:0;
background:#f5f7fa;
}

header{
background:#111827;
color:white;
padding:20px;
text-align:center;
}

.container{
max-width:1000px;
margin:40px auto;
padding:20px;
}

.post{
background:white;
padding:20px;
margin-bottom:20px;
border-radius:8px;
box-shadow:0 2px 8px rgba(0,0,0,0.08);
}

.post h2{
margin-top:0;
}

.readmore{
color:#2563eb;
cursor:pointer;
}

footer{
text-align:center;
padding:30px;
color:#777;
}

</style>

</head>

<body>

<header>

<h1>Tech Insights</h1>
<p>Latest technology trends and innovation</p>

</header>

<div class="container">

<div class="post">
<h2>Artificial Intelligence in 2026</h2>
<p>
Artificial intelligence is transforming industries from healthcare
to finance. Companies are building smarter systems that can
analyze data faster than ever before.
</p>
</div>

<div class="post">
<h2>The Future of Cloud Computing</h2>
<p>
Cloud platforms continue to dominate the infrastructure landscape.
Scalable microservices and containerized applications are now
the standard architecture for modern systems.
</p>
</div>

<div class="post">
<h2>Cybersecurity in Modern Applications</h2>
<p>
Security has become a critical component of software development.
Organizations must implement zero-trust architectures and
continuous monitoring systems.
</p>
</div>

<div class="post">
<h2>Edge Computing Explained</h2>
<p>
Edge computing allows data processing closer to the user,
reducing latency and improving application performance
for real-time systems.
</p>
</div>

</div>

<footer>

<p>© 2026 Tech Insights</p>

</footer>

<script>

// simple interaction (anti-bot behavior signal)

document.addEventListener("scroll",function(){
console.log("User scrolling page.");
});

setTimeout(function(){
console.log("Page fully loaded");
},2000);

</script>

</body>
</html>
"""

    return HTMLResponse(html)
