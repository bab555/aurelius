from fastapi import FastAPI, HTTPException, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional
import uvicorn
import json
from calculator import calculate_bazi
from modules.api import get_formatted_bazi

app = FastAPI(title="八字排盘插件", description="一个简单的四柱八字排盘Dify插件")

# 允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 插件清单
@app.get("/.well-known/ai-plugin.json")
async def get_manifest():
    with open("manifest.json", "r", encoding="utf-8") as f:
        manifest = json.load(f)
    return manifest

# 插件Logo
@app.get("/logo.png")
async def get_logo():
    return {"message": "Logo placeholder"}

# OpenAPI规范
@app.get("/openapi.yaml")
async def get_openapi():
    openapi_schema = {
        "openapi": "3.0.2",
        "info": {
            "title": "八字排盘API",
            "description": "提供四柱八字排盘功能，基于农历日期计算",
            "version": "1.0.0"
        },
        "servers": [
            {
                "url": "http://host.docker.internal:1122",
                "description": "Windows/Mac Docker本地开发环境"
            },
            {
                "url": "http://172.17.0.1:1122",
                "description": "Linux Docker本地开发环境"
            },
            {
                "url": "http://localhost:1122",
                "description": "非Docker环境"
            }
        ],
        "paths": {
            "/calculate_bazi": {
                "post": {
                    "summary": "计算八字排盘",
                    "operationId": "calculateBazi",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "year": {"type": "integer", "description": "出生年份"},  
                                        "month": {"type": "integer", "description": "出生月份"}, 
                                        "day": {"type": "integer", "description": "出生日期"},
                                        "hour": {"type": "integer", "description": "出生小时(24小时制)"},   
                                        "gender": {"type": "string", "description": "性别(男/女)"}
                                    },
                                    "required": ["year", "month", "day"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "八字排盘结果",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/simple_bazi": {
                "post": {
                    "summary": "简化的八字排盘接口",
                    "description": "直接接收年月日时性别参数，返回八字排盘结果",
                    "operationId": "simpleBazi",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "year": {
                                            "type": "integer",
                                            "description": "农历出生年份",
                                            "minimum": 1900,
                                            "maximum": 2100,
                                            "example": 1990
                                        },
                                        "month": {
                                            "type": "integer",
                                            "description": "农历出生月份",
                                            "minimum": 1,
                                            "maximum": 12,
                                            "example": 7
                                        },
                                        "day": {
                                            "type": "integer",
                                            "description": "农历出生日期",
                                            "minimum": 1,
                                            "maximum": 30,
                                            "example": 15
                                        },
                                        "hour": {
                                            "type": "integer",
                                            "description": "出生小时(24小时制)",
                                            "minimum": 0,
                                            "maximum": 23,
                                            "default": 0,
                                            "example": 12
                                        },
                                        "gender": {
                                            "type": "string",
                                            "description": "性别(男/女)",
                                            "enum": ["男", "女"],
                                            "default": "男",
                                            "example": "男"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "八字排盘结果",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "八字排盘结果": {
                                                "type": "object",
                                                "properties": {
                                                    "公历": {
                                                        "type": "string",
                                                        "description": "公历日期",
                                                        "example": "1990年8月5日 12:0"
                                                    },
                                                    "农历": {
                                                        "type": "string",
                                                        "description": "农历日期",
                                                        "example": "1990年7月15日 12:0"
                                                    },
                                                    "四柱八字": {
                                                        "type": "string",
                                                        "description": "年月日时四柱",
                                                        "example": "庚午 丁未 甲子 丙午"
                                                    },
                                                    "纳音五行": {
                                                        "type": "string",
                                                        "description": "四柱纳音五行",
                                                        "example": "年柱:路旁土 月柱:天上火 日柱:海中金 时柱:炉中火"
                                                    },
                                                    "十神": {
                                                        "type": "string",
                                                        "description": "四柱十神",
                                                        "example": "年柱:偏财 月柱:正印 日柱:日主 时柱:伤官"
                                                    },
                                                    "五行分析": {
                                                        "type": "string",
                                                        "description": "五行强弱分析",
                                                        "example": "此命火最旺，水最弱。"
                                                    },
                                                    "大运": {
                                                        "type": "string",
                                                        "description": "大运信息",
                                                        "example": "起运年龄:1, 大运顺序:戊申,己酉,庚戌,辛亥,壬子..."
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            "description": "请求参数错误",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "result": {
                                                "type": "object",
                                                "properties": {
                                                    "error": {
                                                        "type": "string",
                                                        "example": "出生年份必须在1900至2100之间"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/dify": {
                "post": {
                    "summary": "Dify插件专用接口",
                    "description": "符合Dify插件规范的八字排盘接口",
                    "operationId": "difyBazi",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "year": {
                                            "type": "integer",
                                            "description": "农历出生年份",
                                            "minimum": 1900,
                                            "maximum": 2100,
                                            "example": 1990
                                        },
                                        "month": {
                                            "type": "integer",
                                            "description": "农历出生月份",
                                            "minimum": 1,
                                            "maximum": 12,
                                            "example": 7
                                        },
                                        "day": {
                                            "type": "integer",
                                            "description": "农历出生日期",
                                            "minimum": 1,
                                            "maximum": 30,
                                            "example": 15
                                        },
                                        "hour": {
                                            "type": "integer",
                                            "description": "出生小时(24小时制)",
                                            "minimum": 0,
                                            "maximum": 23,
                                            "default": 0,
                                            "example": 12
                                        },
                                        "gender": {
                                            "type": "string",
                                            "description": "性别(男/女)",
                                            "enum": ["男", "女"],
                                            "default": "男",
                                            "example": "男"
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "八字排盘结果",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "result": {
                                                "type": "object",
                                                "properties": {
                                                    "八字排盘结果": {
                                                        "type": "object",
                                                        "properties": {
                                                            "公历": {
                                                                "type": "string",
                                                                "description": "公历日期",
                                                                "example": "1990年8月5日 12:0"
                                                            },
                                                            "农历": {
                                                                "type": "string",
                                                                "description": "农历日期",
                                                                "example": "1990年7月15日 12:0"
                                                            },
                                                            "四柱八字": {
                                                                "type": "string",
                                                                "description": "年月日时四柱",
                                                                "example": "庚午 丁未 甲子 丙午"
                                                            },
                                                            "纳音五行": {
                                                                "type": "string",
                                                                "description": "四柱纳音五行",
                                                                "example": "年柱:路旁土 月柱:天上火 日柱:海中金 时柱:炉中火"
                                                            },
                                                            "十神": {
                                                                "type": "string",
                                                                "description": "四柱十神",
                                                                "example": "年柱:偏财 月柱:正印 日柱:日主 时柱:伤官"
                                                            },
                                                            "五行分析": {
                                                                "type": "string",
                                                                "description": "五行强弱分析",
                                                                "example": "此命火最旺，水最弱。"
                                                            },
                                                            "大运": {
                                                                "type": "string",
                                                                "description": "大运信息",
                                                                "example": "起运年龄:1, 大运顺序:戊申,己酉,庚戌,辛亥,壬子..."
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return openapi_schema

# 请求模型
class BaziRequest(BaseModel):
    year: int = Field(
        ...,
        description="农历出生年份",
        ge=1900,
        le=2100,
        example=1990
    )
    month: int = Field(
        ...,
        description="农历出生月份",
        ge=1,
        le=12,
        example=7
    )
    day: int = Field(
        ...,
        description="农历出生日期",
        ge=1,
        le=30,
        example=15
    )
    hour: int = Field(
        0,
        description="出生小时(24小时制)",
        ge=0,
        le=23,
        example=12
    )
    gender: str = Field(
        "男",
        description="性别(男/女)",
        pattern="^[男女]$"
    )

    # 验证性别
    @validator('gender')
    def validate_gender(cls, v):
        if v not in ["男", "女"]:
            raise ValueError("性别只能是'男'或'女'")
        return v

    class Config:
        schema_extra = {
            "example": {
                "year": 1990,
                "month": 7,
                "day": 15,
                "hour": 12,
                "gender": "男"
            }
        }

# 简化版请求模型
class SimpleBaziRequest(BaseModel):
    year: int = Field(
        ..., 
        description="农历出生年份",
        ge=1900,
        le=2100,
        example=1990
    )
    month: int = Field(
        ...,
        description="农历出生月份",
        ge=1,
        le=12,
        example=7
    )
    day: int = Field(
        ...,
        description="农历出生日期",
        ge=1,
        le=30,
        example=15
    )
    hour: int = Field(
        0,
        description="出生小时(24小时制)",
        ge=0,
        le=23,
        example=12
    )
    gender: str = Field(
        "男",
        description="性别(男/女)",
        pattern="^[男女]$"
    )

    # 验证性别
    @validator('gender')
    def validate_gender(cls, v):
        if v not in ["男", "女"]:
            raise ValueError("性别只能是'男'或'女'")
        return v

    class Config:
        schema_extra = {
            "example": {
                "year": 1990,
                "month": 7,
                "day": 15,
                "hour": 12,
                "gender": "男"
            }
        }

# 计算八字API
@app.post("/calculate_bazi")
async def api_calculate_bazi(request: BaziRequest):
    try:
        # 固定参数
        minute = 0
        is_lunar = True

        result = calculate_bazi(
            request.year,
            request.month,
            request.day,
            request.hour,
            minute,
            request.gender,
            is_lunar
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 简化版八字API
@app.post("/simple_bazi")
async def simple_bazi(request: SimpleBaziRequest):
    try:
        # 获取格式化结果
        formatted_result = get_formatted_bazi(
            request.year,
            request.month,
            request.day,
            request.hour,
            0,  # 分钟固定为0
            request.gender,
            True  # 使用农历
        )

        return formatted_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Dify插件API
@app.post("/api/dify")
async def dify_plugin_handler(
    year: int = Body(..., description="农历出生年份", ge=1900, le=2100, example=1990),
    month: int = Body(..., description="农历出生月份", ge=1, le=12, example=7),
    day: int = Body(..., description="农历出生日期", ge=1, le=30, example=15),
    hour: int = Body(0, description="出生小时(24小时制)", ge=0, le=23, example=12),
    gender: str = Body("男", description="性别(男/女)", pattern="^[男女]$", example="男"),
):
    try:
        # 验证性别
        if gender not in ["男", "女"]:
            return {"result": {"error": "性别只能是'男'或'女'"}}

        # 获取格式化结果
        formatted_result = get_formatted_bazi(year, month, day, hour, 0, gender, True)

        # 检查计算结果是否成功
        if "error" in formatted_result.get("八字排盘结果", {}):
            return {"result": {"error": formatted_result["八字排盘结果"]["error"]}}

        return {"result": formatted_result}
    except Exception as e:
        return {"result": {"error": str(e)}}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=1122, reload=True) 