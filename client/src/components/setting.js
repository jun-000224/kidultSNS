import { Box } from "@mui/material";
import { useNavigate, useNavigation } from "react-router-dom";
import { Button } from "@mui/material";

function Setting() {
    let navigate = useNavigate();
    return (
        <Box>

            {/* 모드 버튼 */}
            <Button
            onClick={() => {
                let param = {

                }
            }}>

                라이트모드 / 다크모드 
            </Button>

            {/* 로그아웃 버튼 */}
            <Button
                onClick={() => {
                    let param = {
                    };

                    fetch("http://localhost:3010/user/logout", {
                        method: "POST",
                        headers: {
                            "Content-type": "application/json"
                        },
                        body: JSON.stringify(param)
                    })
                        .then(res => res.json())
                        .then(data => {
                            console.log(data);
                            alert(data.msg);
                            if (data.result) {
                                localStorage.setItem("token", "");
                                navigate("/");
                            }
                        })
                }}
                variant="contained"
                fullWidth
                sx={{
                    marginTop: '16px',
                    padding: '10px 0',
                    backgroundColor: '#3897f0',
                    fontWeight: 600,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '1rem'
                }}
            >
                로그아웃
            </Button>
        </Box>
    );
}

export default Setting;