import os
from datetime import datetime, timedelta
import requests
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 获取 API 密钥
api_key = os.getenv("OPENAI_API_KEY")

# 获取当前日期和上个月的日期
end_date = datetime.now()
start_date = end_date - timedelta(days=30)

# API 端点
usage_url = "https://api.openai.com/v1/dashboard/billing/usage"
subscription_url = "https://api.openai.com/v1/dashboard/billing/subscription"

# 设置请求头
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

try:
    # 获取使用情况
    params = {
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d")
    }
    
    usage_response = requests.get(usage_url, headers=headers, params=params)
    usage_data = usage_response.json()
    
    # 获取订阅信息
    subscription_response = requests.get(subscription_url, headers=headers)
    subscription_data = subscription_response.json()
    
    print("\nOpenAI API 使用情况:")
    print("-----------------------------------")
    print(f"时间段: {start_date.date()} 到 {end_date.date()}")
    
    if "total_usage" in usage_data:
        print(f"总使用金额: ${usage_data['total_usage'] / 100:.2f}")  # 转换为美元
    
    if "hard_limit_usd" in subscription_data:
        print(f"账户额度上限: ${subscription_data['hard_limit_usd']:.2f}")
    
    # 显示每日使用情况
    print("\n每日使用情况:")
    if "daily_costs" in usage_data:
        for day in usage_data["daily_costs"]:
            date = datetime.fromtimestamp(day["timestamp"]).date()
            cost = sum(item["cost"] for item in day["line_items"]) / 100
            print(f"{date}: ${cost:.3f}")

except Exception as e:
    print(f"Error fetching usage data: {str(e)}")
    print("提示：请确保您的 API 密钥有权限访问账单信息")
