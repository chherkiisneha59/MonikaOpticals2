import urllib.request
import urllib.error

url = 'https://monikaopticals2-1.onrender.com/api/products'
data = b'{}'
headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://monika-opticals2-henna.vercel.app'
}
req = urllib.request.Request(url, data=data, headers=headers, method='OPTIONS')

try:
    response = urllib.request.urlopen(req)
    print("OPTIONS status:", response.status)
    print("OPTIONS headers:", response.headers)
except urllib.error.URLError as e:
    print("OPTIONS Error:", e)

req2 = urllib.request.Request(url, data=data, headers=headers, method='POST')
try:
    response2 = urllib.request.urlopen(req2)
    print("POST status:", response2.status)
    print("POST response:", response2.read().decode())
except urllib.error.HTTPError as e:
    print("POST Error:", e.code, e.read().decode())
